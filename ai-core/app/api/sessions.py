"""
REST API endpoints for session management.

POST   /sessions/start              — create session, return intro message
POST   /sessions/{id}/text-test     — text-only turn (no audio)
POST   /sessions/{id}/advance-phase — manually advance to next phase
POST   /sessions/{id}/end           — end session, generate report
GET    /sessions/{id}/report        — fetch final report
GET    /sessions/{id}/status        — current session status
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.orchestrator import (
    advance_phase,
    end_session,
    get_session_status,
    start_session,
    process_turn,
)
from app.models.evaluation import EvaluationReport

router = APIRouter(prefix="/sessions", tags=["sessions"])


# ── Request / Response models ─────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    session_type: str = Field(
        default="BEHAVIORAL_PRACTICE",
        description="FULL_INTERVIEW | BEHAVIORAL_PRACTICE | TECHNICAL_CONCEPT_PRACTICE | CODING_PRACTICE | RESUME_DEEP_DIVE | CUSTOM_QUESTION",
    )
    duration_minutes: int = Field(default=15, ge=5, le=120)
    mode: str = Field(default="learning", description="learning | professional")
    focus_area: str = Field(default="", description="e.g. 'tell me about yourself', 'Redis caching'")
    context_file: str = Field(default="", description="Structured context from upstream microservice")
    resume: str = Field(default="", max_length=8000)
    job_description: str = Field(default="", max_length=8000)
    company: str = Field(default="")
    role_type: str = Field(default="SDE1")
    difficulty: str = Field(default="medium", description="easy | medium | hard")
    user_id: str = Field(default="demo-user-001")


class StartSessionResponse(BaseModel):
    session_id: str
    intro_message: str
    session_type: str
    mode: str
    duration_minutes: int
    phases: list[str]


class TextTurnRequest(BaseModel):
    transcript: str = Field(..., min_length=1, max_length=4000)


class TextTurnResponse(BaseModel):
    session_id: str
    interviewer_response: str
    guardrail_activated: bool
    current_phase: str | None
    is_session_complete: bool


class AdvancePhaseResponse(BaseModel):
    session_id: str
    new_phase: str | None
    is_complete: bool


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/start", response_model=StartSessionResponse)
async def create_session(body: StartSessionRequest):
    """
    Create a new interview/practice session.
    Returns session_id and the opening interviewer message.
    """
    valid_types = {
        "FULL_INTERVIEW", "BEHAVIORAL_PRACTICE", "TECHNICAL_CONCEPT_PRACTICE",
        "CODING_PRACTICE", "RESUME_DEEP_DIVE", "CUSTOM_QUESTION",
    }
    if body.session_type not in valid_types:
        raise HTTPException(400, f"session_type must be one of: {valid_types}")
    if body.mode not in ("learning", "professional"):
        raise HTTPException(400, "mode must be 'learning' or 'professional'")
    if body.difficulty not in ("easy", "medium", "hard"):
        raise HTTPException(400, "difficulty must be 'easy', 'medium', or 'hard'")

    session_id, intro = await start_session(
        session_type=body.session_type,
        mode=body.mode,
        duration_minutes=body.duration_minutes,
        focus_area=body.focus_area,
        context_file_text=body.context_file,
        resume=body.resume,
        job_description=body.job_description,
        company=body.company,
        role_type=body.role_type,
        difficulty=body.difficulty,
        user_id=body.user_id,
    )

    # Get phase names for the response
    from app.models.session import get_session
    session = get_session(session_id)
    phases = [p.name for p in session.session_plan.phases] if session and session.session_plan else []

    return StartSessionResponse(
        session_id=session_id,
        intro_message=intro,
        session_type=body.session_type,
        mode=body.mode,
        duration_minutes=body.duration_minutes,
        phases=phases,
    )


@router.post("/{session_id}/text-test", response_model=TextTurnResponse)
async def text_turn(session_id: str, body: TextTurnRequest):
    """
    Text-only turn endpoint for testing without audio.
    Submit a transcript and receive the next interviewer response.
    """
    from app.models.session import get_session
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, f"Session {session_id} not found")

    response, guardrail = await process_turn(session_id, body.transcript)

    # Re-fetch session state after processing
    session = get_session(session_id)
    current_phase = session.current_phase.name if session and session.current_phase else None
    is_complete = session.is_complete if session else True

    return TextTurnResponse(
        session_id=session_id,
        interviewer_response=response,
        guardrail_activated=guardrail,
        current_phase=current_phase,
        is_session_complete=is_complete,
    )


@router.post("/{session_id}/advance-phase", response_model=AdvancePhaseResponse)
async def advance_session_phase(session_id: str):
    """Manually advance to the next phase."""
    from app.models.session import get_session
    if not get_session(session_id):
        raise HTTPException(404, f"Session {session_id} not found")

    new_phase = await advance_phase(session_id)
    return AdvancePhaseResponse(
        session_id=session_id,
        new_phase=new_phase,
        is_complete=new_phase is None,
    )


@router.post("/{session_id}/end", response_model=EvaluationReport)
async def finish_session(session_id: str):
    """End the session and generate the evaluation report."""
    from app.models.session import get_session
    if not get_session(session_id):
        raise HTTPException(404, f"Session {session_id} not found")

    report = await end_session(session_id)
    return report


@router.get("/{session_id}/report", response_model=EvaluationReport)
async def get_report(session_id: str):
    """
    Get the evaluation report for a completed session.
    If the session is still active, ends it first.
    """
    from app.models.session import get_session
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, f"Session {session_id} not found or already ended")

    report = await end_session(session_id)
    return report


@router.get("/{session_id}/status")
async def session_status(session_id: str):
    """Return current session status."""
    status = get_session_status(session_id)
    if "error" in status:
        raise HTTPException(404, status["error"])
    return status
