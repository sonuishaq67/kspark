"""
ResponseGenerator — generates the final interviewer message.
Streams response text as soon as possible.
Enforces ghostwriting guardrail.
"""
from __future__ import annotations

import logging
import re
from collections.abc import AsyncGenerator

from app.core.context_loader import CandidateContext
from app.core.memory import build_context_block
from app.features.live_code_review import format_latest_code_block
from app.models.session import InterviewSession, SessionMode
from app.services.openai_service import chat, chat_stream
from app.utils.prompts import get_prompt

logger = logging.getLogger(__name__)

# Ghostwriting detection patterns
_GHOSTWRITE_PATTERNS = [
    r"just tell me what to say",
    r"give me (the |a |an )?answer",
    r"what should i say",
    r"write (it|this|me) (for me|out|up)",
    r"tell me (the |a )?answer",
    r"give me (a |the )?sample",
    r"give me (a |the )?template",
    r"can you (just )?(write|answer|give)",
    r"write (me )?(a |the |my )?(good |perfect |sample |example )?answer",
    r"answer for me",
    r"write my answer",
    r"what (should|would) (i|you) say",
    r"how (should|do) i answer",
    r"(show|tell) me (how to answer|what to say|the answer)",
    r"give me (something|a response|a reply) (to say|i can say|i can use)",
]
_GHOSTWRITE_RE = re.compile("|".join(_GHOSTWRITE_PATTERNS), re.IGNORECASE)


def is_ghostwriting_attempt(transcript: str) -> bool:
    return bool(_GHOSTWRITE_RE.search(transcript))


async def generate_response(
    session: InterviewSession,
    context: CandidateContext,
    selected_question: str,
    final_transcript: str,
) -> str:
    """
    Generate the full interviewer response (non-streaming).
    Enforces ghostwriting guardrail.
    """
    if is_ghostwriting_attempt(final_transcript):
        return _ghostwriting_refusal(session.mode)

    system_prompt = _build_system_prompt(session, context)
    user_content = _build_user_content(session, selected_question, final_transcript)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    return await chat(messages, temperature=0.7, max_tokens=300)


async def generate_response_stream(
    session: InterviewSession,
    context: CandidateContext,
    selected_question: str,
    final_transcript: str,
) -> AsyncGenerator[str, None]:
    """
    Stream the interviewer response token by token.
    Enforces ghostwriting guardrail before streaming.
    """
    if is_ghostwriting_attempt(final_transcript):
        refusal = _ghostwriting_refusal(session.mode)
        # Stream the refusal word by word for consistent UX
        for word in refusal.split():
            yield word + " "
        return

    system_prompt = _build_system_prompt(session, context)
    user_content = _build_user_content(session, selected_question, final_transcript)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    async for delta in chat_stream(messages, temperature=0.7, max_tokens=300):
        yield delta


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_system_prompt(session: InterviewSession, context: CandidateContext) -> str:
    interviewer_prompt = get_prompt("interviewer")
    phase_name = session.current_phase.name if session.current_phase else "INTERVIEW"

    return f"""{interviewer_prompt}

## Session context
Session type: {session.session_type.value}
Mode: {session.mode.value}
Current phase: {phase_name}
Company: {session.company}
Role: {session.role_type}

## Candidate & role context
{context.to_prompt_block()}

## Conversation history
{build_context_block(session)}"""


def _build_user_content(
    session: InterviewSession,
    selected_question: str,
    final_transcript: str,
) -> str:
    code_context = format_latest_code_block(session, "Current Candidate Code")

    return f"""Candidate just said:
{final_transcript}
{code_context}

Selected follow-up question to ask:
{selected_question}

Generate your interviewer response. Keep it short and natural."""


def _ghostwriting_refusal(mode: SessionMode) -> str:
    if mode == SessionMode.LEARNING:
        return (
            "I'm not going to give you the answer — you'll learn faster by working through it yourself. "
            "Here's a nudge: think about a specific situation from your experience. "
            "What's the first thing that comes to mind?"
        )
    else:
        return "That's not how this works. Take your time and answer the question."
