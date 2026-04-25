"""
Session manager — coordinates the orchestrator state machine, sub-agent, and DB persistence.
"""
from __future__ import annotations

import logging
import uuid

from db import queries
from llm.client import CLASSIFIER_MODEL, REASONING_MODEL, chat
from llm.mock_responses import is_mock_mode
from llm.prompts import get_prompt
from orchestrator.state import (
    OrchestratorState,
    SessionState,
    TurnRecord,
    get_session_state,
    remove_session,
    store_session,
)
from orchestrator.sub_agent import SubAgentResponse, run_turn
from orchestrator.thread_tracker import (
    ThreadState,
    create_thread,
    get_open_gaps,
    increment_probe,
    is_complete,
    mark_gap_closed,
)
from questions.loader import get_all_questions

logger = logging.getLogger(__name__)

DEMO_USER_ID = "demo-user-001"


async def start_session(
    mode: str = "professional",
    persona_id: str = "neutral",
    user_id: str = DEMO_USER_ID,
) -> str:
    """Create a new session in DB and in-process store. Returns session_id."""
    session_id = str(uuid.uuid4())
    questions = get_all_questions()

    # Initialise thread tracker for each question
    thread_tracker: dict[str, ThreadState] = {
        q.id: create_thread(q.id, q.gap_hints) for q in questions
    }

    session = SessionState(
        session_id=session_id,
        user_id=user_id,
        mode=mode,
        persona_id=persona_id,
        question_plan=questions,
        current_question_index=0,
        state=OrchestratorState.INTRO,
        thread_tracker=thread_tracker,
    )
    store_session(session)

    # Persist to DB and use the DB-generated session_id as the canonical id
    remove_session(session_id)   # remove the temp in-memory entry

    db_result = await queries.create_session(mode=mode, persona_id=persona_id, user_id=user_id)
    real_session_id = db_result["session_id"]

    session.session_id = real_session_id
    store_session(session)

    logger.info("Session started: %s mode=%s persona=%s", real_session_id, mode, persona_id)
    return real_session_id


async def get_intro_message(session_id: str) -> str:
    """Generate the opening interviewer message for a session."""
    session = get_session_state(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    first_q = session.current_question
    if not first_q:
        return "Welcome! Let's get started."

    persona_fragment = _get_persona_fragment(session.persona_id)

    system = f"""You are an AI interviewer starting a mock interview session.
{persona_fragment}
Mode: {session.mode}
Greet the candidate briefly (1-2 sentences) and ask the first question naturally.
Do NOT list what you'll cover. Just greet and ask."""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": f"First question to ask: {first_q.text}"},
    ]

    if is_mock_mode():
        intro = _mock_intro_message(first_q.text, session.persona_id)
    else:
        from llm.client import chat
        intro = await chat(messages, model=REASONING_MODEL, temperature=0.7, max_tokens=120)

    # Record the intro as an agent turn
    session.turn_history.append(TurnRecord(
        question_id=first_q.id,
        speaker="agent",
        transcript=intro,
    ))
    session.state = OrchestratorState.RUNNING_QUESTION
    await queries.update_session_state(session_id, OrchestratorState.RUNNING_QUESTION.value)
    await queries.append_turn(
        session_id=session_id,
        question_id=first_q.id,
        speaker="agent",
        transcript=intro,
    )

    return intro


async def process_turn(session_id: str, transcript: str) -> SubAgentResponse:
    """
    Process one candidate turn:
    1. Run sub-agent (classify → probe/advance/refuse/clarify/stall)
    2. Update thread tracker
    3. Advance question if complete
    4. Flush turn to SQLite
    """
    session = get_session_state(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    current_q = session.current_question
    if not current_q:
        return SubAgentResponse(
            action="advance",
            utterance="We've covered all the questions. Let's wrap up.",
        )

    thread = session.thread_tracker[current_q.id]
    persona_fragment = _get_persona_fragment(session.persona_id)

    # Build prior turn history for context
    prior_history = [
        {"speaker": t.speaker, "transcript": t.transcript}
        for t in session.turn_history[-8:]
    ]

    # Run sub-agent
    response = await run_turn(
        question=current_q,
        thread_state=thread,
        turn_transcript=transcript,
        mode=session.mode,
        persona_id=session.persona_id,
        persona_prompt_fragment=persona_fragment,
        prior_turn_history=prior_history,
    )

    # Update thread tracker
    if response.gap_addressed:
        mark_gap_closed(thread, response.gap_addressed)
    if response.action == "probe":
        increment_probe(thread)

    # Record candidate turn
    candidate_turn = TurnRecord(
        question_id=current_q.id,
        speaker="candidate",
        transcript=transcript,
        classification=response.classification,
        gap_addressed=response.gap_addressed,
        probe_count=thread.probe_count,
    )
    session.turn_history.append(candidate_turn)

    # Record agent turn
    agent_turn = TurnRecord(
        question_id=current_q.id,
        speaker="agent",
        transcript=response.utterance,
    )
    session.turn_history.append(agent_turn)

    # Persist both turns to DB
    await queries.append_turn(
        session_id=session_id,
        question_id=current_q.id,
        speaker="candidate",
        transcript=transcript,
        classification=response.classification,
        gap_addressed=response.gap_addressed,
        probe_count=thread.probe_count,
    )
    await queries.append_turn(
        session_id=session_id,
        question_id=current_q.id,
        speaker="agent",
        transcript=response.utterance,
    )

    # Advance question if complete
    if response.action == "advance" or is_complete(thread):
        thread.status = "closed"
        session.current_question_index += 1

        if session.current_question_index >= len(session.question_plan):
            session.state = OrchestratorState.CLOSING
            await queries.update_session_state(
                session_id,
                OrchestratorState.CLOSING.value,
                current_question_idx=session.current_question_index,
                questions_completed=session.current_question_index,
            )
        else:
            # Ask the next question
            next_q = session.current_question
            next_q_utterance = await _transition_to_next_question(
                next_q.text, persona_fragment, session.mode
            )
            session.turn_history.append(TurnRecord(
                question_id=next_q.id,
                speaker="agent",
                transcript=next_q_utterance,
            ))
            await queries.append_turn(
                session_id=session_id,
                question_id=next_q.id,
                speaker="agent",
                transcript=next_q_utterance,
            )
            await queries.update_session_state(
                session_id,
                OrchestratorState.RUNNING_QUESTION.value,
                current_question_idx=session.current_question_index,
                questions_completed=session.current_question_index,
            )
            # Append the next question to the response utterance
            response.utterance = f"{response.utterance}\n\n{next_q_utterance}"

    return response


async def end_session(session_id: str) -> str:
    """
    End the session, generate TLDR, persist to DB, clean up in-process state.
    Returns the TLDR string.
    """
    session = get_session_state(session_id)
    if not session:
        # Try to get from DB
        db_session = await queries.get_session(session_id)
        if db_session and db_session.get("tldr"):
            return db_session["tldr"]
        return "Session not found."

    # Build thread summary for the feedback prompt
    thread_summary = _build_thread_summary(session)

    # Build full transcript
    transcript_text = "\n".join(
        f"{'Candidate' if t.speaker == 'candidate' else 'Interviewer'}: {t.transcript}"
        for t in session.turn_history
    )

    tldr = await _generate_tldr(
        transcript=transcript_text,
        thread_summary=thread_summary,
        mode=session.mode,
        questions_completed=session.questions_completed,
    )

    # Persist to DB
    await queries.end_session(
        session_id=session_id,
        tldr=tldr,
        questions_completed=session.questions_completed,
    )

    # Clean up in-process state
    remove_session(session_id)

    logger.info("Session ended: %s tldr_len=%d", session_id, len(tldr))
    return tldr


def get_thread_summary(session_id: str) -> list[dict]:
    """Return thread tracker state for the report endpoint."""
    session = get_session_state(session_id)
    if not session:
        return []
    return _build_thread_summary_list(session)


# ── helpers ───────────────────────────────────────────────────────────────────

def _get_persona_fragment(persona_id: str) -> str:
    """Load persona prompt fragment, with fallback."""
    try:
        from config.loader import get_persona
        persona = get_persona(persona_id)
        return persona.prompt_fragment
    except Exception:
        # Fallback if config not loaded yet
        defaults = {
            "friendly": "You are a warm, encouraging interviewer. Use supportive language.",
            "neutral": "You are a professional, matter-of-fact interviewer.",
            "challenging": "You are a demanding interviewer. Push back on vague answers.",
        }
        return defaults.get(persona_id, defaults["neutral"])


def _build_thread_summary(session: SessionState) -> str:
    lines = []
    for q in session.question_plan:
        thread = session.thread_tracker.get(q.id)
        if not thread:
            continue
        open_gaps = get_open_gaps(thread)
        closed_gaps = list(thread.gaps_closed)
        lines.append(
            f"Question: {q.text}\n"
            f"  Gaps probed: {thread.probe_count}\n"
            f"  Gaps closed: {closed_gaps or 'none'}\n"
            f"  Gaps still open: {open_gaps or 'none'}\n"
            f"  Status: {thread.status}"
        )
    return "\n\n".join(lines)


def _build_thread_summary_list(session: SessionState) -> list[dict]:
    result = []
    for q in session.question_plan:
        thread = session.thread_tracker.get(q.id)
        if not thread:
            continue
        result.append({
            "question_id": q.id,
            "question_text": q.text,
            "topic": q.topic,
            "gaps_probed": thread.probe_count,
            "gaps_closed": list(thread.gaps_closed),
            "gaps_open": get_open_gaps(thread),
            "status": thread.status,
        })
    return result


def _mock_intro_message(question_text: str, persona_id: str) -> str:
    persona_openers = {
        "friendly": "Welcome in. Let's keep this practical and low-pressure.",
        "challenging": "Let's start directly and keep the bar high.",
        "neutral": "Let's begin.",
    }
    opener = persona_openers.get(persona_id, persona_openers["neutral"])
    return f"{opener} First question: {question_text}"


async def _generate_tldr(
    transcript: str,
    thread_summary: str,
    mode: str,
    questions_completed: int,
) -> str:
    system_prompt = get_prompt("generate_feedback")

    user_content = f"""## Session metadata
Mode: {mode}
Questions completed: {questions_completed}

## Thread tracker (what was probed and what was closed)
{thread_summary}

## Full transcript
{transcript}

Generate the TLDR feedback summary."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    return await chat(messages, model=REASONING_MODEL, temperature=0.6, max_tokens=300)


async def _transition_to_next_question(
    next_question_text: str,
    persona_fragment: str,
    mode: str,
) -> str:
    if is_mock_mode():
        return f"Let's move on. {next_question_text}"

    system = f"""You are an AI interviewer transitioning to the next question.
{persona_fragment}
Mode: {mode}
Ask the next question naturally. One brief transition phrase + the question. Max 2 sentences."""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": f"Next question: {next_question_text}"},
    ]

    return await chat(messages, model=CLASSIFIER_MODEL, temperature=0.6, max_tokens=100)
