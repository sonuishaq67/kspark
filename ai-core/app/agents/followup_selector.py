"""
FollowupSelector — fast, small LLM call to pick the best next question
from the candidate question list when speech_ended fires.
Optimised for low latency.
"""
from __future__ import annotations

import logging

from app.models.session import CandidateQuestion, InterviewSession
from app.services.openai_service import chat_json
from app.utils.prompts import get_prompt

logger = logging.getLogger(__name__)


async def select_best_followup(
    session: InterviewSession,
    final_transcript: str,
) -> str:
    """
    Select the best follow-up question from session.candidate_questions.
    Uses a fast, small LLM call (gpt-4o-mini).
    Returns the selected question text.
    """
    candidates = session.candidate_questions
    if not candidates:
        # No pre-generated questions — fall back to a generic probe
        return "Can you elaborate on that?"

    if len(candidates) == 1:
        selected = candidates[0].question
        session.selected_question = selected
        return selected

    system_prompt = get_prompt("followup_selector")

    candidates_text = "\n".join(
        f"{i+1}. [{q.question_type}] {q.question} (reason: {q.reason})"
        for i, q in enumerate(candidates)
    )

    user_content = f"""## Final transcript
{final_transcript}

## Candidate questions to choose from
{candidates_text}

## Current phase
{session.current_phase.name if session.current_phase else 'UNKNOWN'}

Select the best next question. Return JSON."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    try:
        import os
        fast_model = os.getenv("OPENAI_FAST_MODEL", "gpt-4o-mini")
        result = await chat_json(messages, model=fast_model)
        selected = result.get("selected_question", candidates[0].question)
        session.selected_question = selected
        logger.debug("Selected followup: %s", selected[:80])
        return selected

    except Exception as exc:
        logger.error("Followup selection failed: %s", exc)
        # Fall back to highest priority question
        selected = candidates[0].question
        session.selected_question = selected
        return selected
