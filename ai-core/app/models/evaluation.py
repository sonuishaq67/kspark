"""
Evaluation and report models.
"""
from __future__ import annotations

from pydantic import BaseModel


class MetricScore(BaseModel):
    metric: str
    score: float          # 0.0 – 10.0
    rationale: str


class EvaluationReport(BaseModel):
    session_id: str
    session_type: str
    overall_score: float
    metric_scores: list[MetricScore]
    strengths: list[str]
    weaknesses: list[str]
    best_answer: str
    weakest_answer: str
    improved_answer_example: str
    action_plan: list[str]
    raw_feedback: str = ""
