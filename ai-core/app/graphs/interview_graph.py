"""
LangGraph interview orchestration graph.

Nodes:
  load_context          → parse context file into CandidateContext
  create_session_plan   → build SessionPlan from session type + context
  receive_transcript    → buffer incoming transcript chunk
  update_live_context   → update live_transcript_buffer + trigger question gen
  generate_questions    → background question generation (while user speaks)
  detect_speech_end     → triggered when speech_ended event fires
  select_best_followup  → fast LLM call to pick best question
  generate_response     → generate final interviewer response (streaming)
  synthesize_tts        → send text to TTS pipeline
  update_memory         → add turn to history, compact if needed
  advance_phase         → check if current phase is done, transition if so
  generate_report       → end-of-session evaluation

The graph is modular — different session types reuse the same nodes
with different SessionPlans driving the phase transitions.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

from langgraph.graph import END, StateGraph

from app.agents.evaluator import generate_report
from app.agents.followup_selector import select_best_followup
from app.agents.question_generator import generate_candidate_questions
from app.agents.response_generator import generate_response, is_ghostwriting_attempt
from app.core.context_loader import CandidateContext, load_context
from app.core.memory import add_turn, build_context_block
from app.core.session_planner import create_session_plan
from app.models.session import (
    InterviewSession,
    PhaseStatus,
    SessionMode,
    TurnRecord,
    get_session,
)
from app.services.tts_service import synthesize_bytes

logger = logging.getLogger(__name__)


# ── Graph state ───────────────────────────────────────────────────────────────

class GraphState(dict):
    """
    Typed dict passed between LangGraph nodes.
    Keys:
      session_id        str
      event_type        str   — "transcript_chunk" | "speech_ended" | "end_session"
      transcript_chunk  str   — partial transcript text
      final_transcript  str   — complete transcript when speech ends
      context           CandidateContext | None
      interviewer_text  str   — generated response
      audio_bytes       bytes — TTS output
      report            EvaluationReport | None
      error             str | None
    """


# ── Node implementations ──────────────────────────────────────────────────────

async def node_load_context(state: GraphState) -> GraphState:
    """Parse context file into CandidateContext. Runs once at session start."""
    session_id = state["session_id"]
    session = get_session(session_id)
    if not session:
        return {**state, "error": f"Session {session_id} not found"}

    ctx = load_context(
        context_file_text=session.context_file_text,
        resume=session.resume,
        job_description=session.job_description,
        company=session.company,
        role_type=session.role_type,
    )
    return {**state, "context": ctx}


async def node_create_session_plan(state: GraphState) -> GraphState:
    """Build SessionPlan. Runs once at session start."""
    session_id = state["session_id"]
    session = get_session(session_id)
    context: CandidateContext = state.get("context")

    if not session or not context:
        return {**state, "error": "Missing session or context"}

    plan = create_session_plan(
        session_type=session.session_type,
        duration_minutes=session.duration_minutes,
        mode=session.mode,
        focus_area=session.focus_area,
        context=context,
        difficulty=session.difficulty,
    )
    session.session_plan = plan
    session.time_remaining_seconds = session.duration_minutes * 60

    # Activate first phase
    if plan.phases:
        plan.phases[0].status = PhaseStatus.ACTIVE

    logger.info("Session plan created: session=%s phases=%d", session_id, len(plan.phases))
    return state


async def node_receive_transcript(state: GraphState) -> GraphState:
    """Buffer incoming transcript chunk."""
    session_id = state["session_id"]
    session = get_session(session_id)
    chunk = state.get("transcript_chunk", "")

    if session and chunk:
        session.live_transcript_buffer += " " + chunk

    return state


async def node_update_live_context(state: GraphState) -> GraphState:
    """
    Update live context and kick off background question generation.
    Called on each transcript chunk while user is speaking.
    """
    session_id = state["session_id"]
    session = get_session(session_id)
    context: CandidateContext = state.get("context")

    if not session or not context:
        return state

    # Fire-and-forget question generation (don't await — runs in background)
    asyncio.create_task(
        generate_candidate_questions(
            session=session,
            context=context,
            partial_transcript=session.live_transcript_buffer,
        )
    )

    return state


async def node_generate_questions(state: GraphState) -> GraphState:
    """
    Explicit question generation node (used when we want to await the result).
    """
    session_id = state["session_id"]
    session = get_session(session_id)
    context: CandidateContext = state.get("context")

    if not session or not context:
        return state

    await generate_candidate_questions(
        session=session,
        context=context,
        partial_transcript=session.live_transcript_buffer,
    )
    return state


async def node_detect_speech_end(state: GraphState) -> GraphState:
    """
    Triggered when speech_ended event fires.
    Finalises the transcript buffer.
    """
    session_id = state["session_id"]
    session = get_session(session_id)
    final_transcript = state.get("final_transcript", "")

    if session:
        # Use the provided final transcript or fall back to buffer
        if not final_transcript:
            final_transcript = session.live_transcript_buffer.strip()
        session.live_transcript_buffer = ""  # Reset buffer

    return {**state, "final_transcript": final_transcript}


async def node_select_best_followup(state: GraphState) -> GraphState:
    """Fast LLM call to select the best follow-up question."""
    session_id = state["session_id"]
    session = get_session(session_id)
    final_transcript = state.get("final_transcript", "")

    if not session:
        return state

    selected = await select_best_followup(session, final_transcript)
    return {**state, "selected_question": selected}


async def node_generate_response(state: GraphState) -> GraphState:
    """Generate the final interviewer response."""
    session_id = state["session_id"]
    session = get_session(session_id)
    context: CandidateContext = state.get("context")
    selected_question = state.get("selected_question", "Can you tell me more?")
    final_transcript = state.get("final_transcript", "")

    if not session or not context:
        return {**state, "interviewer_text": "Can you elaborate on that?"}

    response_text = await generate_response(
        session=session,
        context=context,
        selected_question=selected_question,
        final_transcript=final_transcript,
    )

    return {**state, "interviewer_text": response_text}


async def node_synthesize_tts(state: GraphState) -> GraphState:
    """Convert interviewer text to audio."""
    text = state.get("interviewer_text", "")
    if not text:
        return {**state, "audio_bytes": b""}

    audio = await synthesize_bytes(text)
    return {**state, "audio_bytes": audio}


async def node_update_memory(state: GraphState) -> GraphState:
    """Add candidate and interviewer turns to session history."""
    session_id = state["session_id"]
    session = get_session(session_id)
    final_transcript = state.get("final_transcript", "")
    interviewer_text = state.get("interviewer_text", "")

    if not session:
        return state

    phase_name = session.current_phase.name if session.current_phase else "UNKNOWN"

    if final_transcript:
        add_turn(session, TurnRecord(
            speaker="candidate",
            transcript=final_transcript,
            phase=phase_name,
        ))

    if interviewer_text:
        add_turn(session, TurnRecord(
            speaker="interviewer",
            transcript=interviewer_text,
            phase=phase_name,
        ))

    return state


async def node_advance_phase(state: GraphState) -> GraphState:
    """
    Check if the current phase should advance.
    Phase advancement is driven by:
    - Time budget exhausted
    - Explicit advance signal from orchestrator
    """
    session_id = state["session_id"]
    session = get_session(session_id)

    if not session or not session.session_plan:
        return state

    current_phase = session.current_phase
    if not current_phase:
        return state

    # For MVP: advance is triggered explicitly by the orchestrator
    # Time-based advancement can be added here
    advance = state.get("advance_phase", False)
    if advance:
        current_phase.status = PhaseStatus.COMPLETE
        session.current_phase_index += 1

        next_phase = session.current_phase
        if next_phase:
            next_phase.status = PhaseStatus.ACTIVE
            logger.info(
                "Phase advanced: session=%s phase=%s",
                session_id, next_phase.name,
            )

    return state


async def node_generate_report(state: GraphState) -> GraphState:
    """Generate the end-of-session evaluation report."""
    session_id = state["session_id"]
    session = get_session(session_id)
    context: CandidateContext = state.get("context")

    if not session or not context:
        return {**state, "report": None, "error": "Missing session or context"}

    report = await generate_report(session, context)
    session.scores = {"overall": report.overall_score}

    logger.info(
        "Report generated: session=%s score=%.1f",
        session_id, report.overall_score,
    )
    return {**state, "report": report}


# ── Routing functions ─────────────────────────────────────────────────────────

def route_event(state: GraphState) -> str:
    """Route based on incoming event type."""
    event_type = state.get("event_type", "")
    if event_type == "transcript_chunk":
        return "receive_transcript"
    elif event_type == "speech_ended":
        return "detect_speech_end"
    elif event_type == "end_session":
        return "generate_report"
    else:
        return END


def route_after_speech_end(state: GraphState) -> str:
    """After speech ends, check if we have pre-generated questions."""
    session_id = state.get("session_id", "")
    session = get_session(session_id)
    if session and session.candidate_questions:
        return "select_best_followup"
    return "generate_questions"


# ── Graph builder ─────────────────────────────────────────────────────────────

def build_interview_graph() -> StateGraph:
    """
    Build and compile the LangGraph interview graph.
    Returns a compiled graph ready for invocation.
    """
    graph = StateGraph(GraphState)

    # Register nodes
    graph.add_node("load_context", node_load_context)
    graph.add_node("create_session_plan", node_create_session_plan)
    graph.add_node("receive_transcript", node_receive_transcript)
    graph.add_node("update_live_context", node_update_live_context)
    graph.add_node("generate_questions", node_generate_questions)
    graph.add_node("detect_speech_end", node_detect_speech_end)
    graph.add_node("select_best_followup", node_select_best_followup)
    graph.add_node("generate_response", node_generate_response)
    graph.add_node("synthesize_tts", node_synthesize_tts)
    graph.add_node("update_memory", node_update_memory)
    graph.add_node("advance_phase", node_advance_phase)
    graph.add_node("generate_report", node_generate_report)

    # Entry point — route based on event type
    graph.set_entry_point("load_context")

    # Session init flow (runs once)
    graph.add_edge("load_context", "create_session_plan")
    graph.add_edge("create_session_plan", END)

    # Transcript chunk flow
    graph.add_edge("receive_transcript", "update_live_context")
    graph.add_edge("update_live_context", END)

    # Speech ended flow
    graph.add_conditional_edges(
        "detect_speech_end",
        route_after_speech_end,
        {
            "select_best_followup": "select_best_followup",
            "generate_questions": "generate_questions",
        },
    )
    graph.add_edge("generate_questions", "select_best_followup")
    graph.add_edge("select_best_followup", "generate_response")
    graph.add_edge("generate_response", "synthesize_tts")
    graph.add_edge("synthesize_tts", "update_memory")
    graph.add_edge("update_memory", "advance_phase")
    graph.add_edge("advance_phase", END)

    # Report flow
    graph.add_edge("generate_report", END)

    return graph.compile()


# Singleton compiled graph
_graph = None


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_interview_graph()
    return _graph
