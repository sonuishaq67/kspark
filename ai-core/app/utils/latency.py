"""
Latency tracking utilities.
Tracks key timing metrics for the turn pipeline.
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class LatencyTracker:
    session_id: str
    speech_end_time: float | None = None
    question_selected_time: float | None = None
    first_token_time: float | None = None
    first_audio_time: float | None = None
    turn_complete_time: float | None = None

    def mark_speech_end(self) -> None:
        self.speech_end_time = time.perf_counter()

    def mark_question_selected(self) -> None:
        self.question_selected_time = time.perf_counter()

    def mark_first_token(self) -> None:
        self.first_token_time = time.perf_counter()

    def mark_first_audio(self) -> None:
        self.first_audio_time = time.perf_counter()

    def mark_turn_complete(self) -> None:
        self.turn_complete_time = time.perf_counter()

    def to_dict(self) -> dict[str, float | None]:
        def ms(start: float | None, end: float | None) -> float | None:
            if start is None or end is None:
                return None
            return round((end - start) * 1000, 1)

        metrics = {
            "speech_end_to_question_selected_ms": ms(self.speech_end_time, self.question_selected_time),
            "question_selected_to_first_token_ms": ms(self.question_selected_time, self.first_token_time),
            "first_token_to_first_audio_ms": ms(self.first_token_time, self.first_audio_time),
            "total_turn_latency_ms": ms(self.speech_end_time, self.turn_complete_time),
        }

        self._log(metrics)
        return metrics

    def _log(self, metrics: dict) -> None:
        total = metrics.get("total_turn_latency_ms")
        q_sel = metrics.get("speech_end_to_question_selected_ms")
        first_tok = metrics.get("question_selected_to_first_token_ms")
        logger.info(
            "Latency session=%s total=%.0fms q_select=%.0fms first_token=%.0fms",
            self.session_id,
            total or 0,
            q_sel or 0,
            first_tok or 0,
        )
