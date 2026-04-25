"""
InterviewOrchestrator — central coordinator.

Owns:
  - session lifecycle (start, process turn, end)
  - phase tracking and transitions
  - rolling conversation summary
  - dispatching to the LangGraph graph
  - streaming response delivery

One orchestrator instance per session (held in-process).
"""
from __future__ import annotations

import asyncio
import logging
import uuid
from collections.abc import AsyncGenerator

from app.agents.response_generator import generate_response_stream, is_ghostwriting_attempt
from app.core.context_loader import CandidateContext, load_context
from app.core.memory import add_turn, build_context_block
from app.core.session_planner import create_session_plan
from app.models.evaluation import EvaluationReport
from app.models.session import (
    Difficulty,
    InterviewSession,
    PhaseStatus,
    SessionMode,
    SessionType,
    TurnRecord,
    get_session,
    remove_session,
    store_session,
)
from app.services.tts_service import synthesize_bytes
from app.utils.latency import LatencyTracker
from app.utils.prompts import get_prompt
from app.services.openai_service import chat

logger = logging.getLogger(__name__)

# Per-session context cache (avoids re-parsing on every turn)
_context_cache: dict[str, CandidateContext] = {}


async def start_session(
    session_type: str,
    mode: str,
    duration_minutes: int,
    focus_area: str,
    context_file_text: str,
    resume: str,
    job_description: str,
    company: str,
    role_type: str,
    difficulty: str = "medium",
    user_id: str = "demo-user-001",
) -> tuple[str, str]:
    """
    Create a new session, build the plan, generate the opening message.
    Returns (session_id, intro_message).
    """
    session_id = str(uuid.uuid4())

    session = InterviewSession(
        session_id=session_id,
        user_id=user_id,
        session_type=SessionType(session_type),
        mode=SessionMode(mode),
        duration_minutes=duration_minutes,
        difficulty=Difficulty(difficulty),
        focus_area=focus_area,
        company=company,
        role_type=role_type,
        context_file_text=context_file_text,
        resume=resume,
        job_description=job_description,
        time_remaining_seconds=duration_minutes * 60,
    )

    # Parse context
    ctx = load_context(
        context_file_text=context_file_text,
        resume=resume,
        job_description=job_description,
        company=company,
        role_type=role_type,
    )
    _context_cache[session_id] = ctx

    # Build session plan
    plan = create_session_plan(
        session_type=session.session_type,
        duration_minutes=duration_minutes,
        mode=session.mode,
        focus_area=focus_area,
        context=ctx,
        difficulty=session.difficulty,
    )
    session.session_plan = plan

    # Activate first phase
    if plan.phases:
        plan.phases[0].status = PhaseStatus.ACTIVE

    store_session(session)

    # Parse gaps from context if available (from readiness analysis)
    _init_gap_tracking(session, ctx)

    # Generate opening message
    intro = await _generate_intro(session, ctx)

    # Record intro as first turn
    add_turn(session, TurnRecord(
        speaker="interviewer",
        transcript=intro,
        phase=session.current_phase.name if session.current_phase else "INTRODUCTION",
    ))

    logger.info(
        "Session started: id=%s type=%s mode=%s company=%s role=%s",
        session_id, session_type, mode, company, role_type,
    )
    return session_id, intro


async def process_turn(
    session_id: str,
    final_transcript: str,
) -> dict:
    """
    Process one complete candidate turn (text mode).
    Returns dict with response, guardrail, phase, gaps, completion status.
    """
    session = get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    ctx = _context_cache.get(session_id) or load_context(
        context_file_text=session.context_file_text,
        resume=session.resume,
        job_description=session.job_description,
        company=session.company,
        role_type=session.role_type,
    )

    guardrail_activated = is_ghostwriting_attempt(final_transcript)
    if guardrail_activated:
        session.guardrail_activations += 1

    # Generate candidate questions synchronously in text mode
    from app.agents.question_generator import generate_candidate_questions
    await generate_candidate_questions(session, ctx, final_transcript)

    # Select best follow-up
    from app.agents.followup_selector import select_best_followup
    selected = await select_best_followup(session, final_transcript)

    # Generate response
    from app.agents.response_generator import generate_response
    response = await generate_response(
        session=session,
        context=ctx,
        selected_question=selected,
        final_transcript=final_transcript,
    )

    # Update gap tracking based on what the candidate said
    gap_update = _update_gap_tracking(session, final_transcript)

    # Update memory
    phase_name = session.current_phase.name if session.current_phase else "UNKNOWN"
    add_turn(session, TurnRecord(
        speaker="candidate",
        transcript=final_transcript,
        phase=phase_name,
    ))
    add_turn(session, TurnRecord(
        speaker="interviewer",
        transcript=response,
        phase=phase_name,
    ))

    return {
        "interviewer_response": response,
        "guardrail_activated": guardrail_activated,
        "current_phase": session.current_phase.name if session.current_phase else None,
        "is_session_complete": session.is_complete,
        "gaps": _get_gap_snapshot(session),
        "gap_addressed": gap_update.get("gap_addressed"),
        "gap_status_change": gap_update.get("status_change"),
    }


async def process_turn_stream(
    session_id: str,
    final_transcript: str,
) -> AsyncGenerator[str, None]:
    """
    Process one candidate turn and stream the interviewer response.
    Yields text deltas.
    """
    session = get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    ctx = _context_cache.get(session_id) or load_context(
        context_file_text=session.context_file_text,
        resume=session.resume,
        job_description=session.job_description,
        company=session.company,
        role_type=session.role_type,
    )

    # Generate questions in background while we start streaming
    question_task = asyncio.create_task(
        _prepare_followup(session, ctx, final_transcript)
    )

    # Wait for question selection (fast call)
    selected = await question_task

    # Stream response
    full_response = []
    async for delta in generate_response_stream(
        session=session,
        context=ctx,
        selected_question=selected,
        final_transcript=final_transcript,
    ):
        full_response.append(delta)
        yield delta

    # Update memory after streaming completes
    phase_name = session.current_phase.name if session.current_phase else "UNKNOWN"
    add_turn(session, TurnRecord(
        speaker="candidate",
        transcript=final_transcript,
        phase=phase_name,
    ))
    add_turn(session, TurnRecord(
        speaker="interviewer",
        transcript="".join(full_response),
        phase=phase_name,
    ))


async def advance_phase(session_id: str) -> str | None:
    """
    Manually advance to the next phase.
    Returns the new phase name, or None if session is complete.
    """
    session = get_session(session_id)
    if not session or not session.session_plan:
        return None

    current = session.current_phase
    if current:
        current.status = PhaseStatus.COMPLETE

    session.current_phase_index += 1
    next_phase = session.current_phase

    if next_phase:
        next_phase.status = PhaseStatus.ACTIVE
        logger.info("Phase advanced: session=%s → %s", session_id, next_phase.name)
        return next_phase.name

    logger.info("Session complete: session=%s", session_id)
    return None


async def end_session(session_id: str) -> EvaluationReport:
    """
    End the session and generate the evaluation report.
    Cleans up in-process state.
    """
    session = get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    ctx = _context_cache.get(session_id) or load_context(
        context_file_text=session.context_file_text,
        resume=session.resume,
        job_description=session.job_description,
        company=session.company,
        role_type=session.role_type,
    )

    from app.agents.evaluator import generate_report
    report = await generate_report(session, ctx)

    from app.models.session import store_report
    store_report(report)

    # Clean up active runtime state, but keep the completed report fetchable.
    remove_session(session_id)
    _context_cache.pop(session_id, None)

    logger.info("Session ended: id=%s score=%.1f", session_id, report.overall_score)
    return report


def get_session_status(session_id: str) -> dict:
    """Return current session status for polling."""
    session = get_session(session_id)
    if not session:
        return {"error": "Session not found"}

    current_phase = session.current_phase
    plan = session.session_plan

    return {
        "session_id": session_id,
        "session_type": session.session_type.value,
        "mode": session.mode.value,
        "current_phase": current_phase.name if current_phase else None,
        "current_phase_index": session.current_phase_index,
        "total_phases": len(plan.phases) if plan else 0,
        "time_remaining_seconds": session.time_remaining_seconds,
        "turns_count": len(session.turn_history),
        "is_complete": session.is_complete,
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _generate_intro(session: InterviewSession, ctx: CandidateContext) -> str:
    """Generate the opening interviewer message."""
    interviewer_prompt = get_prompt("interviewer")
    phase = session.current_phase
    phase_name = phase.name if phase else "INTRODUCTION"
    phase_desc = phase.description if phase else "Start the interview"

    system = f"""{interviewer_prompt}

## Session context
Session type: {session.session_type.value}
Mode: {session.mode.value}
Company: {session.company}
Role: {session.role_type}
Focus area: {session.focus_area}

## Candidate context
{ctx.to_prompt_block()}"""

    user = f"""You are starting a {session.session_type.value.replace('_', ' ').lower()} session.
Current phase: {phase_name} — {phase_desc}

Generate a brief, natural opening message (2-3 sentences max).
Greet the candidate, set context, and ask the first question or prompt.
Do NOT list the full agenda."""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]

    return await chat(messages, temperature=0.7, max_tokens=150)


async def _prepare_followup(
    session: InterviewSession,
    ctx: CandidateContext,
    transcript: str,
) -> str:
    """Generate questions and select the best one. Returns selected question."""
    from app.agents.question_generator import generate_candidate_questions
    from app.agents.followup_selector import select_best_followup

    await generate_candidate_questions(session, ctx, transcript)
    return await select_best_followup(session, transcript)


def _init_gap_tracking(session: InterviewSession, ctx: CandidateContext) -> None:
    """Initialize gap tracking from context (readiness analysis data)."""
    # Parse gaps from risk_areas and role_expectations in context
    gaps = []

    for area in ctx.risk_areas:
        gaps.append({
            "label": area,
            "category": "missing",
            "evidence": None,
            "status": "open",
        })

    for topic in ctx.likely_topics[:5]:
        if not any(g["label"].lower() == topic.lower() for g in gaps):
            gaps.append({
                "label": topic,
                "category": "partial",
                "evidence": None,
                "status": "open",
            })

    for highlight in ctx.resume_highlights[:3]:
        gaps.append({
            "label": highlight,
            "category": "strong",
            "evidence": "Listed on resume",
            "status": "open",
        })

    session.gap_context = gaps
    session.open_gaps = [g["label"] for g in gaps if g["category"] in ("missing", "partial")]

    logger.info(
        "Gap tracking initialized: session=%s total=%d open=%d",
        session.session_id, len(gaps), len(session.open_gaps),
    )


def _update_gap_tracking(session: InterviewSession, transcript: str) -> dict:
    """
    Check if the candidate's answer addresses any open gaps.
    Uses fuzzy substring matching.
    Returns {"gap_addressed": str|None, "status_change": str|None}.
    """
    if not session.gap_context or not transcript:
        return {"gap_addressed": None, "status_change": None}

    transcript_lower = transcript.lower()
    best_match = None
    best_score = 0

    for gap in session.gap_context:
        if gap["status"] == "closed":
            continue

        label_lower = gap["label"].lower()
        # Check if any significant words from the gap label appear in the transcript
        words = [w for w in label_lower.split() if len(w) > 3]
        if not words:
            words = label_lower.split()

        matches = sum(1 for w in words if w in transcript_lower)
        score = matches / max(len(words), 1)

        if score > best_score and score >= 0.4:
            best_score = score
            best_match = gap

    if not best_match:
        return {"gap_addressed": None, "status_change": None}

    old_status = best_match["status"]
    if old_status == "open":
        best_match["status"] = "improved"
        best_match["evidence"] = transcript[:200]
    elif old_status == "improved":
        best_match["status"] = "closed"
        best_match["evidence"] = transcript[:200]
        if best_match["label"] in session.open_gaps:
            session.open_gaps.remove(best_match["label"])
        if best_match["label"] not in session.closed_gaps:
            session.closed_gaps.append(best_match["label"])

    session.current_gap_being_tested = best_match["label"]

    return {
        "gap_addressed": best_match["label"],
        "status_change": f"{old_status} → {best_match['status']}",
    }


def _get_gap_snapshot(session: InterviewSession) -> list[dict]:
    """Return current gap state for the frontend."""
    return [
        {
            "label": g["label"],
            "category": g["category"],
            "status": g["status"],
            "evidence": g.get("evidence"),
        }
        for g in session.gap_context
    ]
