"""
REST API routes for session management.
"""
from __future__ import annotations

import json
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db import queries
from llm.client import REASONING_MODEL, chat
from llm.mock_responses import get_mock_response, is_mock_mode
from llm.prompts import get_prompt
from orchestrator.session_manager import (
    end_session,
    get_intro_message,
    get_thread_summary,
    start_session,
)
from orchestrator.state import OrchestratorState, get_session_state
from questions.loader import get_all_questions

router = APIRouter(prefix="/api", tags=["sessions"])

DEMO_USER_ID = "demo-user-001"


# ── request / response models ─────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    mode: str = "professional"
    persona_id: str = "neutral"


class StartSessionResponse(BaseModel):
    session_id: str
    user_id: str
    intro_message: str


class SessionMetaResponse(BaseModel):
    session_id: str
    state: str
    current_question_index: int
    total_questions: int
    mode: str
    persona_id: str
    started_at: str


class EndSessionResponse(BaseModel):
    tldr: str
    turns_count: int
    questions_completed: int


class GapReportItem(BaseModel):
    label: str
    status: Literal["open", "improved", "closed"]
    evidence: str | None = None


class ReportScores(BaseModel):
    role_alignment: int
    technical_clarity: int
    communication: int
    evidence_strength: int
    followup_recovery: int


class FollowUpAnalysisItem(BaseModel):
    question: str
    reason: str
    candidate_response_quality: Literal["strong", "partial", "weak"]


class FinishSessionResponse(BaseModel):
    report_id: str
    session_id: str
    summary: str
    strengths: list[str]
    gaps: list[GapReportItem]
    scores: ReportScores
    follow_up_analysis: list[FollowUpAnalysisItem]
    next_practice_plan: list[str]


class ReportResponse(FinishSessionResponse):
    created_at: str
    target_role: str | None = None
    readiness_score: int | None = None
    started_at: str
    ended_at: str | None = None


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.post("/sessions", response_model=StartSessionResponse)
async def create_session(body: StartSessionRequest):
    """Create a new interview session and return the opening message."""
    if body.mode not in ("learning", "professional"):
        raise HTTPException(400, "mode must be 'learning' or 'professional'")
    if body.persona_id not in ("friendly", "neutral", "challenging"):
        raise HTTPException(400, "persona_id must be 'friendly', 'neutral', or 'challenging'")

    session_id = await start_session(
        mode=body.mode,
        persona_id=body.persona_id,
        user_id=DEMO_USER_ID,
    )
    intro = await get_intro_message(session_id)

    return StartSessionResponse(
        session_id=session_id,
        user_id=DEMO_USER_ID,
        intro_message=intro,
    )


@router.get("/sessions/{session_id}", response_model=SessionMetaResponse)
async def get_session(session_id: str):
    """Return session metadata."""
    # Check in-process store first (active session)
    in_memory = get_session_state(session_id)
    if in_memory:
        return SessionMetaResponse(
            session_id=session_id,
            state=in_memory.state.value,
            current_question_index=in_memory.current_question_index,
            total_questions=len(in_memory.question_plan),
            mode=in_memory.mode,
            persona_id=in_memory.persona_id,
            started_at="",  # not stored in memory
        )

    # Fall back to DB (ended session)
    row = await queries.get_session(session_id)
    if not row:
        raise HTTPException(404, "Session not found")

    return SessionMetaResponse(
        session_id=session_id,
        state=row["state"],
        current_question_index=row["current_question_idx"],
        total_questions=len(get_all_questions()),
        mode=row["mode"],
        persona_id=row["persona_id"],
        started_at=row["started_at"],
    )


@router.post("/sessions/{session_id}/end", response_model=EndSessionResponse)
async def end_session_legacy(session_id: str):
    """End the session and generate the TLDR feedback."""
    turns = await queries.get_turns_for_session(session_id)
    tldr = await end_session(session_id)

    row = await queries.get_session(session_id)
    questions_completed = row["questions_completed"] if row else 0

    return EndSessionResponse(
        tldr=tldr,
        turns_count=len(turns),
        questions_completed=questions_completed,
    )


@router.post("/sessions/{session_id}/finish", response_model=FinishSessionResponse)
async def finish_session(session_id: str):
    """Generate and persist the structured RoleReady report."""
    session_row = await queries.get_session(session_id)
    in_memory = get_session_state(session_id)
    if not session_row and not in_memory:
        raise HTTPException(404, "Session not found")

    existing_report = await queries.get_report(session_id)
    if existing_report:
        return _finish_response_from_report(existing_report)

    turns = await queries.get_turns_for_session(session_id)
    candidate_turns = [turn for turn in turns if turn["speaker"] == "candidate"]
    if not candidate_turns:
        raise HTTPException(422, "No turns to analyze")

    context = _build_report_context(
        session_id=session_id,
        session_row=session_row,
        turns=turns,
    )

    if is_mock_mode():
        raw_report = get_mock_response("report_generator")
    else:
        raw_report = await _generate_report_from_llm(context)

    try:
        parsed_report = FinishSessionResponse(
            report_id="pending",
            session_id=session_id,
            summary=raw_report["summary"],
            strengths=raw_report["strengths"],
            gaps=raw_report["gaps"],
            scores=raw_report["scores"],
            follow_up_analysis=raw_report["follow_up_analysis"],
            next_practice_plan=raw_report["next_practice_plan"],
        )
    except Exception as exc:  # pragma: no cover - defensive validation
        raise HTTPException(500, "Report generation failed") from exc

    report_id = await queries.insert_report(
        session_id=session_id,
        summary=parsed_report.summary,
        strengths=parsed_report.strengths,
        gaps=[item.model_dump() for item in parsed_report.gaps],
        scores=parsed_report.scores.model_dump(),
        follow_up_analysis=[item.model_dump() for item in parsed_report.follow_up_analysis],
        next_practice_plan=parsed_report.next_practice_plan,
    )
    await queries.mark_session_ended(session_id)
    if in_memory:
        in_memory.state = OrchestratorState.ENDED

    return parsed_report.model_copy(update={"report_id": report_id})


@router.get("/sessions/{session_id}/report")
async def get_report(session_id: str):
    """Return stored structured report or fall back to the legacy report shape."""
    stored_report = await queries.get_report(session_id)
    if stored_report:
        return ReportResponse(**stored_report)

    row = await queries.get_session(session_id)
    if not row:
        raise HTTPException(404, "Session not found")

    if _is_role_ready_session(row):
        raise HTTPException(404, "Report not generated yet")

    turns = await queries.get_turns_for_session(session_id)

    # Thread summary from in-process state (if still active) or reconstruct from turns
    thread_summary = get_thread_summary(session_id)

    return {
        "session_id": session_id,
        "tldr": row.get("tldr"),
        "mode": row["mode"],
        "persona_id": row["persona_id"],
        "started_at": row["started_at"],
        "ended_at": row.get("ended_at"),
        "questions_completed": row["questions_completed"],
        "turns": [dict(t) for t in turns],
        "thread_summary": thread_summary,
    }


@router.get("/sessions")
async def list_sessions():
    """List recent sessions for the demo user (dashboard)."""
    rows = await queries.get_sessions_list(user_id=DEMO_USER_ID)
    result = []
    for r in rows:
        summary_preview = r.get("summary_preview") or ""
        result.append({
            "session_id": r["id"],
            "started_at": r["started_at"],
            "ended_at": r.get("ended_at"),
            "state": r["state"],
            "mode": r["mode"],
            "persona_id": r["persona_id"],
            "questions_completed": r["questions_completed"],
            "tldr_preview": (
                summary_preview[:120] + "..." if len(summary_preview) > 120 else summary_preview
            ),
            "target_role": r.get("target_role"),
            "readiness_score": r.get("readiness_score"),
            "main_gap": r.get("main_gap"),
        })
    return result


@router.get("/questions")
async def list_questions():
    """Return demo questions (text only, no gap hints) for the interview UI."""
    questions = get_all_questions()
    return [{"id": q.id, "text": q.text, "topic": q.topic} for q in questions]


def _finish_response_from_report(report: dict) -> FinishSessionResponse:
    return FinishSessionResponse(
        report_id=report["report_id"],
        session_id=report["session_id"],
        summary=report["summary"],
        strengths=report["strengths"],
        gaps=report["gaps"],
        scores=report["scores"],
        follow_up_analysis=report["follow_up_analysis"],
        next_practice_plan=report["next_practice_plan"],
    )


def _is_role_ready_session(row: dict) -> bool:
    return any(
        row.get(key) is not None
        for key in ("target_role", "company_name", "readiness_score", "summary")
    )


def _build_report_context(
    session_id: str,
    session_row: dict | None,
    turns: list[dict],
) -> str:
    transcript_text = "\n".join(
        f"{'Candidate' if turn['speaker'] == 'candidate' else 'Interviewer'}: {turn['transcript']}"
        for turn in turns
    )
    thread_summary = get_thread_summary(session_id)
    follow_up_turns = [
        {
            "question_id": turn["question_id"],
            "classification": turn.get("classification"),
            "gap_addressed": turn.get("gap_addressed"),
            "probe_count": turn.get("probe_count"),
            "transcript": turn["transcript"],
        }
        for turn in turns
        if turn["speaker"] == "candidate"
    ]

    metadata = {
        "target_role": session_row.get("target_role") if session_row else None,
        "interview_type": session_row.get("interview_type") if session_row else None,
        "mode": session_row.get("mode") if session_row else None,
        "state": session_row.get("state") if session_row else None,
    }

    return (
        "## Session metadata\n"
        f"{json.dumps(metadata, indent=2)}\n\n"
        "## Gap tracker state\n"
        f"{json.dumps(thread_summary, indent=2)}\n\n"
        "## Candidate turn analysis\n"
        f"{json.dumps(follow_up_turns, indent=2)}\n\n"
        "## Full transcript\n"
        f"{transcript_text}"
    )


async def _generate_report_from_llm(context: str) -> dict:
    messages = [
        {"role": "system", "content": get_prompt("report_generator")},
        {"role": "user", "content": context},
    ]

    try:
        raw = await chat(
            messages=messages,
            model=REASONING_MODEL,
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=1400,
        )
        return json.loads(raw)
    except Exception as exc:
        raise HTTPException(500, "Report generation failed") from exc
