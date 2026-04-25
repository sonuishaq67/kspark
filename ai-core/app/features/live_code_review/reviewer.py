"""
LiveCodeReviewer — reviews the candidate's current code during coding practice.
"""
from __future__ import annotations

import logging
from typing import Any

from app.core.context_loader import CandidateContext
from app.core.memory import build_context_block
from app.models.session import InterviewSession
from app.services.openai_service import chat_json
from app.utils.prompts import get_prompt

logger = logging.getLogger(__name__)


async def review_code(
    session: InterviewSession,
    context: CandidateContext,
    code: str,
    language: str,
) -> dict[str, Any]:
    """
    Return a structured, interviewer-style review of the current code.
    The review is intentionally hint-based so the candidate keeps ownership.
    """
    if not code.strip():
        return {
            "summary": "Start by sketching the function shape and the main cases you need to handle.",
            "status": "idle",
            "issues": [],
            "next_prompt": "What input and output shape are you solving for?",
        }

    phase_name = session.current_phase.name if session.current_phase else "CODING"
    system_prompt = get_prompt("code_reviewer")
    numbered_code = _number_code(code)

    user_content = f"""## Session Info
Session type: {session.session_type.value}
Mode: {session.mode.value}
Current phase: {phase_name}
Focus area: {session.focus_area}
Language: {language}

## Candidate & Role Context
{context.to_prompt_block()}

## Conversation so far
{build_context_block(session)}

## Current code with line numbers
{numbered_code}

Review the current code as live interviewer feedback. Return JSON only."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    try:
        result = await chat_json(messages)
        return _normalize_review(result)
    except Exception as exc:
        logger.error("Code review failed: %s", exc, exc_info=True)
        return {
            "summary": "I could not review this update yet. Keep working through the approach.",
            "status": "idle",
            "issues": [],
            "next_prompt": "What case do you want to validate next?",
        }


def _number_code(code: str) -> str:
    return "\n".join(f"{i + 1}: {line}" for i, line in enumerate(code.splitlines()))


def _normalize_review(data: dict[str, Any]) -> dict[str, Any]:
    valid_statuses = {"idle", "reviewing", "needs_attention", "strong"}
    valid_severities = {"info", "warning", "error"}
    valid_categories = {
        "correctness",
        "edge_case",
        "complexity",
        "readability",
        "testing",
        "approach",
    }

    issues = []
    for raw in data.get("issues", []):
        if not isinstance(raw, dict):
            continue
        severity = raw.get("severity", "info")
        category = raw.get("category", "approach")
        issues.append({
            "severity": severity if severity in valid_severities else "info",
            "line": raw.get("line"),
            "category": category if category in valid_categories else "approach",
            "message": str(raw.get("message", ""))[:300],
            "hint": str(raw.get("hint", ""))[:300],
        })

    status = data.get("status", "needs_attention" if issues else "strong")
    return {
        "summary": str(data.get("summary", "Review updated."))[:400],
        "status": status if status in valid_statuses else "needs_attention",
        "issues": issues[:4],
        "next_prompt": str(data.get("next_prompt", "What would you test next?"))[:300],
    }
