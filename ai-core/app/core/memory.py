"""
Conversation memory — rolling summary and transcript management.
Keeps the LLM context window lean by summarising older turns.
"""
from __future__ import annotations

import logging

from app.models.session import InterviewSession, TurnRecord

logger = logging.getLogger(__name__)

# Summarise when turn history exceeds this length
SUMMARY_TRIGGER_TURNS = 16
TURNS_TO_KEEP_VERBATIM = 8


def add_turn(session: InterviewSession, turn: TurnRecord) -> None:
    """Append a turn and trigger summarisation if needed."""
    session.turn_history.append(turn)
    if len(session.turn_history) >= SUMMARY_TRIGGER_TURNS:
        _maybe_summarise(session)


def _maybe_summarise(session: InterviewSession) -> None:
    """
    Summarise older turns into conversation_summary.
    Keep the most recent TURNS_TO_KEEP_VERBATIM turns verbatim.
    This is called synchronously — the actual LLM summarisation
    is deferred to avoid blocking the turn pipeline.
    For MVP we just truncate; the orchestrator can call
    async_summarise() in the background.
    """
    if len(session.turn_history) <= TURNS_TO_KEEP_VERBATIM:
        return

    old_turns = session.turn_history[:-TURNS_TO_KEEP_VERBATIM]
    session.turn_history = session.turn_history[-TURNS_TO_KEEP_VERBATIM:]

    # Append old turns to a simple running summary (no LLM call here)
    old_text = "\n".join(
        f"{'Candidate' if t.speaker == 'candidate' else 'Interviewer'}: {t.transcript}"
        for t in old_turns
    )
    if session.conversation_summary:
        session.conversation_summary += f"\n\n[Earlier exchange]\n{old_text}"
    else:
        session.conversation_summary = f"[Earlier exchange]\n{old_text}"

    logger.debug(
        "Memory compacted: session=%s kept=%d summarised=%d",
        session.session_id, len(session.turn_history), len(old_turns),
    )


def build_context_block(session: InterviewSession) -> str:
    """
    Build the full context block for LLM prompts:
    rolling summary + recent verbatim turns.
    """
    parts = []

    if session.conversation_summary:
        parts.append(f"## Conversation Summary (earlier)\n{session.conversation_summary}")

    recent = session.formatted_transcript(last_n=TURNS_TO_KEEP_VERBATIM)
    if recent:
        parts.append(f"## Recent Conversation\n{recent}")

    return "\n\n".join(parts)
