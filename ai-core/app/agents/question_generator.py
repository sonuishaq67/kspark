"""
QuestionGenerationModule — runs in background while candidate is speaking.
Generates 3-5 possible follow-up questions using partial transcript + context.
"""
from __future__ import annotations

import json
import logging

from app.core.context_loader import CandidateContext
from app.core.memory import build_context_block
from app.models.session import CandidateQuestion, InterviewSession
from app.services.openai_service import chat_json
from app.utils.prompts import get_prompt

logger = logging.getLogger(__name__)


async def generate_candidate_questions(
    session: InterviewSession,
    context: CandidateContext,
    partial_transcript: str,
) -> list[CandidateQuestion]:
    """
    Generate 3-5 possible follow-up questions.
    Called while the candidate is still speaking (pre-emptive generation).
    Updates session.candidate_questions in place and returns the list.
    """
    current_phase = session.current_phase
    phase_name = current_phase.name if current_phase else "UNKNOWN"

    system_prompt = get_prompt("question_generator")
    context_block = build_context_block(session)

    user_content = f"""## Session Info
Session type: {session.session_type.value}
Mode: {session.mode.value}
Current phase: {phase_name}
Focus area: {session.focus_area}

## Candidate & Role Context
{context.to_prompt_block()}

## Conversation so far
{context_block}

## Partial transcript (candidate still speaking)
{partial_transcript}

Generate 3-5 follow-up questions. Return JSON."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    try:
        result = await chat_json(messages)
        questions_raw = result.get("questions", [])
        questions = [
            CandidateQuestion(
                question=q.get("question", ""),
                reason=q.get("reason", ""),
                phase=q.get("phase", phase_name),
                priority_score=float(q.get("priority_score", 0.5)),
                question_type=q.get("question_type", "probe"),
            )
            for q in questions_raw
            if q.get("question")
        ]
        # Sort by priority descending
        questions.sort(key=lambda q: q.priority_score, reverse=True)
        session.candidate_questions = questions
        logger.debug("Generated %d candidate questions for phase=%s", len(questions), phase_name)
        return questions

    except Exception as exc:
        logger.error("Question generation failed: %s", exc)
        return session.candidate_questions  # Return existing list on failure
