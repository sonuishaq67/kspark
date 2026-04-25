"""
REST API routes for session management.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db import queries
from orchestrator.session_manager import (
    end_session,
    get_intro_message,
    get_thread_summary,
    start_session,
)
from orchestrator.state import get_session_state
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
async def finish_session(session_id: str):
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


@router.get("/sessions/{session_id}/report")
async def get_report(session_id: str):
    """Return the full session report: TLDR + turns + thread summary."""
    row = await queries.get_session(session_id)
    if not row:
        raise HTTPException(404, "Session not found")

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
    rows = await queries.list_sessions(user_id=DEMO_USER_ID)
    result = []
    for r in rows:
        tldr = r.get("tldr") or ""
        result.append({
            "session_id": r["id"],
            "started_at": r["started_at"],
            "ended_at": r.get("ended_at"),
            "state": r["state"],
            "mode": r["mode"],
            "persona_id": r["persona_id"],
            "questions_completed": r["questions_completed"],
            "tldr_preview": tldr[:120] + "..." if len(tldr) > 120 else tldr,
        })
    return result


@router.get("/questions")
async def list_questions():
    """Return demo questions (text only, no gap hints) for the interview UI."""
    questions = get_all_questions()
    return [{"id": q.id, "text": q.text, "topic": q.topic} for q in questions]
