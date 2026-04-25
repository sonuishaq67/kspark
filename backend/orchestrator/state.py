"""
In-process session store.
State is held in a module-level dict and flushed to SQLite at session end.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from questions.loader import Question


class OrchestratorState(str, Enum):
    PLANNING = "PLANNING"
    INTRO = "INTRO"
    RUNNING_QUESTION = "RUNNING_QUESTION"
    INTER_QUESTION = "INTER_QUESTION"
    CLOSING = "CLOSING"
    ENDED = "ENDED"


@dataclass
class TurnRecord:
    question_id: str
    speaker: str          # "candidate" | "agent"
    transcript: str
    classification: str | None = None
    gap_addressed: str | None = None
    probe_count: int = 0


@dataclass
class SessionState:
    session_id: str
    user_id: str
    mode: str                          # "learning" | "professional"
    persona_id: str                    # "friendly" | "neutral" | "challenging"
    question_plan: list[Question]
    current_question_index: int = 0
    state: OrchestratorState = OrchestratorState.PLANNING
    turn_history: list[TurnRecord] = field(default_factory=list)
    # question_id -> ThreadState (imported lazily to avoid circular import)
    thread_tracker: dict[str, Any] = field(default_factory=dict)
    sub_agent_summaries: list[str] = field(default_factory=list)

    @property
    def current_question(self) -> Question | None:
        if self.current_question_index < len(self.question_plan):
            return self.question_plan[self.current_question_index]
        return None

    @property
    def questions_completed(self) -> int:
        return self.current_question_index


# Module-level in-process store
_sessions: dict[str, SessionState] = {}


def store_session(session: SessionState) -> None:
    _sessions[session.session_id] = session


def get_session_state(session_id: str) -> SessionState | None:
    return _sessions.get(session_id)


def remove_session(session_id: str) -> None:
    _sessions.pop(session_id, None)
