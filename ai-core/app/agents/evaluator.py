"""
Evaluator — generates the end-of-session feedback report.
Handles all session types with type-specific rubrics.
"""
from __future__ import annotations

import json
import logging

from app.core.context_loader import CandidateContext
from app.features.live_code_review import format_latest_code_block
from app.models.evaluation import EvaluationReport, MetricScore
from app.models.session import InterviewSession, SessionType
from app.services.openai_service import chat_json
from app.utils.prompts import get_prompt

logger = logging.getLogger(__name__)


async def generate_report(
    session: InterviewSession,
    context: CandidateContext,
) -> EvaluationReport:
    """
    Generate the full evaluation report for a completed session.
    Uses type-specific rubric and prompt.
    """
    is_coding = session.session_type == SessionType.CODING_PRACTICE
    prompt_name = "coding_evaluator" if is_coding else "evaluator"
    system_prompt = get_prompt(prompt_name)

    rubric = session.session_plan.evaluation_rubric if session.session_plan else {}
    rubric_text = "\n".join(f"- **{k}**: {v}" for k, v in rubric.items())

    transcript = session.formatted_transcript(last_n=100)
    code_block = format_latest_code_block(session, "Final Candidate Code")
    if code_block:
        code_block += f"""
## Latest Live Code Review
{json.dumps(session.latest_code_review or {}, indent=2)}
"""

    user_content = f"""## Session Info
Session type: {session.session_type.value}
Mode: {session.mode.value}
Duration: {session.duration_minutes} minutes
Focus area: {session.focus_area}
Company: {session.company}
Role: {session.role_type}

## Evaluation Rubric
{rubric_text}

## Candidate Context
{context.to_prompt_block()}

## Full Transcript
{transcript}
{code_block}

## Conversation Summary
{session.conversation_summary}

Generate the evaluation report as JSON."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    try:
        result = await chat_json(messages)
        return _parse_report(session.session_id, session.session_type.value, result)
    except Exception as exc:
        logger.error("Report generation failed: %s", exc)
        return _fallback_report(session.session_id, session.session_type.value)


def _parse_report(session_id: str, session_type: str, data: dict) -> EvaluationReport:
    metric_scores = [
        MetricScore(
            metric=m.get("metric", "unknown"),
            score=float(m.get("score", 5.0)),
            rationale=m.get("rationale", ""),
        )
        for m in data.get("metric_scores", [])
    ]

    return EvaluationReport(
        session_id=session_id,
        session_type=session_type,
        overall_score=float(data.get("overall_score", 5.0)),
        metric_scores=metric_scores,
        strengths=data.get("strengths", []),
        weaknesses=data.get("weaknesses", []),
        best_answer=data.get("best_answer", ""),
        weakest_answer=data.get("weakest_answer", ""),
        improved_answer_example=data.get("improved_answer_example", ""),
        action_plan=data.get("action_plan", []),
        raw_feedback=json.dumps(data),
    )


def _fallback_report(session_id: str, session_type: str) -> EvaluationReport:
    return EvaluationReport(
        session_id=session_id,
        session_type=session_type,
        overall_score=0.0,
        metric_scores=[],
        strengths=[],
        weaknesses=[],
        best_answer="",
        weakest_answer="",
        improved_answer_example="",
        action_plan=["Report generation failed — please retry."],
        raw_feedback="",
    )
