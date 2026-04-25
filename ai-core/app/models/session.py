"""
Core data models for interview sessions.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

from app.models.evaluation import EvaluationReport


# ── Enums ─────────────────────────────────────────────────────────────────────

class SessionType(str, Enum):
    FULL_INTERVIEW = "FULL_INTERVIEW"
    BEHAVIORAL_PRACTICE = "BEHAVIORAL_PRACTICE"
    TECHNICAL_CONCEPT_PRACTICE = "TECHNICAL_CONCEPT_PRACTICE"
    CODING_PRACTICE = "CODING_PRACTICE"
    RESUME_DEEP_DIVE = "RESUME_DEEP_DIVE"
    CUSTOM_QUESTION = "CUSTOM_QUESTION"


class SessionMode(str, Enum):
    LEARNING = "learning"
    PROFESSIONAL = "professional"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class PhaseStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETE = "complete"
    SKIPPED = "skipped"


# ── Session Plan ──────────────────────────────────────────────────────────────

@dataclass
class SessionPhase:
    name: str                        # e.g. "BEHAVIORAL", "CODING_ROUND"
    description: str
    time_budget_seconds: int
    status: PhaseStatus = PhaseStatus.PENDING
    elapsed_seconds: int = 0


@dataclass
class SessionPlan:
    session_type: SessionType
    phases: list[SessionPhase]
    time_budget_by_phase: dict[str, int]   # phase_name -> seconds
    primary_goal: str
    evaluation_rubric: dict[str, str]      # metric -> description
    question_strategy: str


# ── Candidate Questions ───────────────────────────────────────────────────────

@dataclass
class CandidateQuestion:
    question: str
    reason: str
    phase: str
    priority_score: float
    question_type: str   # "behavioral" | "technical" | "probe" | "clarify" | "coding"


# ── Turn Record ───────────────────────────────────────────────────────────────

@dataclass
class TurnRecord:
    speaker: str          # "candidate" | "interviewer"
    transcript: str
    phase: str
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    classification: str | None = None   # "complete" | "partial" | "clarify" | "stall" | "refusal"
    gap_addressed: str | None = None


# ── Main Session State ────────────────────────────────────────────────────────

@dataclass
class InterviewSession:
    session_id: str
    user_id: str
    session_type: SessionType
    mode: SessionMode
    duration_minutes: int
    difficulty: Difficulty
    focus_area: str
    company: str
    role_type: str

    # Context from upstream microservice
    context_file_text: str = ""
    resume: str = ""
    job_description: str = ""

    # Runtime state
    session_plan: SessionPlan | None = None
    current_phase_index: int = 0
    turn_history: list[TurnRecord] = field(default_factory=list)
    conversation_summary: str = ""
    live_transcript_buffer: str = ""
    latest_code: str = ""
    latest_language: str = "python"
    code_snapshots: list[dict[str, Any]] = field(default_factory=list)
    latest_code_review: dict[str, Any] | None = None

    # Question pipeline
    candidate_questions: list[CandidateQuestion] = field(default_factory=list)
    selected_question: str | None = None

    # Timing
    time_remaining_seconds: int = 0
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    # Scores (populated at end)
    scores: dict[str, Any] = field(default_factory=dict)

    @property
    def current_phase(self) -> SessionPhase | None:
        if self.session_plan and self.current_phase_index < len(self.session_plan.phases):
            return self.session_plan.phases[self.current_phase_index]
        return None

    @property
    def is_complete(self) -> bool:
        if not self.session_plan:
            return False
        return self.current_phase_index >= len(self.session_plan.phases)

    @property
    def recent_turns(self) -> list[TurnRecord]:
        """Last 8 turns for context windows."""
        return self.turn_history[-8:]

    def formatted_transcript(self, last_n: int = 20) -> str:
        turns = self.turn_history[-last_n:]
        lines = []
        for t in turns:
            speaker = "Candidate" if t.speaker == "candidate" else "Interviewer"
            lines.append(f"{speaker}: {t.transcript}")
        return "\n".join(lines)


# ── In-process session store ──────────────────────────────────────────────────

_sessions: dict[str, InterviewSession] = {}
_reports: dict[str, EvaluationReport] = {}


def store_session(session: InterviewSession) -> None:
    _sessions[session.session_id] = session


def get_session(session_id: str) -> InterviewSession | None:
    return _sessions.get(session_id)


def remove_session(session_id: str) -> None:
    _sessions.pop(session_id, None)


def list_sessions() -> list[InterviewSession]:
    return list(_sessions.values())


def store_report(report: EvaluationReport) -> None:
    _reports[report.session_id] = report


def get_report(session_id: str) -> EvaluationReport | None:
    return _reports.get(session_id)
