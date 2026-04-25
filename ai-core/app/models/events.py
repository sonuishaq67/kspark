"""
WebSocket event models — client ↔ server.
"""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel


# ── Client → Server ───────────────────────────────────────────────────────────

class TranscriptChunkEvent(BaseModel):
    type: Literal["transcript_chunk"] = "transcript_chunk"
    text: str
    is_final: bool = False


class SpeechStartedEvent(BaseModel):
    type: Literal["speech_started"] = "speech_started"


class SpeechEndedEvent(BaseModel):
    type: Literal["speech_ended"] = "speech_ended"
    final_transcript: str


class AudioChunkEvent(BaseModel):
    type: Literal["audio_chunk"] = "audio_chunk"
    data: str   # base64-encoded audio bytes


class CodeUpdateEvent(BaseModel):
    type: Literal["code_update"] = "code_update"
    code: str
    language: str = "python"


class ModeUpdateEvent(BaseModel):
    type: Literal["mode_update"] = "mode_update"
    mode: str   # "learning" | "professional"


class EndSessionEvent(BaseModel):
    type: Literal["end_session"] = "end_session"


# ── Server → Client ───────────────────────────────────────────────────────────

class InterviewerTextDeltaEvent(BaseModel):
    type: Literal["interviewer_text_delta"] = "interviewer_text_delta"
    delta: str
    is_final: bool = False


class InterviewerAudioChunkEvent(BaseModel):
    type: Literal["interviewer_audio_chunk"] = "interviewer_audio_chunk"
    data: str   # base64-encoded audio bytes


class SelectedQuestionEvent(BaseModel):
    type: Literal["selected_question"] = "selected_question"
    question: str
    phase: str


class PhaseUpdateEvent(BaseModel):
    type: Literal["phase_update"] = "phase_update"
    phase: str
    description: str
    phase_index: int
    total_phases: int


class TimerUpdateEvent(BaseModel):
    type: Literal["timer_update"] = "timer_update"
    time_remaining_seconds: int
    current_phase: str


class ReportReadyEvent(BaseModel):
    type: Literal["report_ready"] = "report_ready"
    session_id: str
    report_url: str


class ErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    code: str
    message: str


class LatencyMetricsEvent(BaseModel):
    type: Literal["latency_metrics"] = "latency_metrics"
    speech_end_to_question_selected_ms: float | None = None
    question_selected_to_first_token_ms: float | None = None
    first_token_to_first_audio_ms: float | None = None
    total_turn_latency_ms: float | None = None


class CodeReviewEvent(BaseModel):
    type: Literal["code_review"] = "code_review"
    language: str
    review: dict[str, Any]
