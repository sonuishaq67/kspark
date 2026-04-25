"""
SessionPlanner — converts session_type + duration + focus_area + context
into a concrete SessionPlan with phases and time budgets.
"""
from __future__ import annotations

import logging

from app.core.context_loader import CandidateContext
from app.models.session import (
    Difficulty,
    SessionMode,
    SessionPhase,
    SessionPlan,
    SessionType,
)

logger = logging.getLogger(__name__)

# ── Evaluation rubrics per session type ───────────────────────────────────────

RUBRICS: dict[SessionType, dict[str, str]] = {
    SessionType.FULL_INTERVIEW: {
        "communication": "Clarity, structure, and conciseness of responses",
        "technical_depth": "Depth and accuracy of technical knowledge",
        "problem_solving": "Approach to ambiguous or complex problems",
        "coding_correctness": "Correctness and efficiency of code",
        "edge_cases": "Awareness and handling of edge cases",
        "ownership": "Evidence of ownership and impact in past work",
        "confidence": "Confidence and composure under pressure",
        "hire_signal": "Overall signal for hiring decision",
    },
    SessionType.BEHAVIORAL_PRACTICE: {
        "structure": "Use of STAR or equivalent structure",
        "clarity": "Clarity and coherence of the story",
        "relevance": "Relevance to the question asked",
        "confidence": "Confidence and delivery",
        "specificity": "Use of specific details and metrics",
        "star_quality": "Quality of Situation, Task, Action, Result",
    },
    SessionType.TECHNICAL_CONCEPT_PRACTICE: {
        "conceptual_clarity": "Accuracy and clarity of the core concept",
        "correctness": "Technical correctness",
        "depth": "Depth of understanding beyond surface level",
        "examples": "Use of concrete examples",
        "tradeoffs": "Awareness of tradeoffs and limitations",
        "communication": "Ability to explain to a non-expert",
    },
    SessionType.CODING_PRACTICE: {
        "approach": "Quality of initial approach and problem decomposition",
        "correctness": "Correctness of the solution",
        "complexity": "Awareness of time/space complexity",
        "edge_cases": "Handling of edge cases",
        "code_quality": "Readability and structure of code",
        "debugging": "Ability to identify and fix bugs",
    },
    SessionType.RESUME_DEEP_DIVE: {
        "ownership": "Evidence of personal ownership vs team contribution",
        "implementation_depth": "Depth of technical implementation knowledge",
        "metrics": "Use of quantifiable impact and metrics",
        "tradeoffs": "Awareness of design tradeoffs made",
        "credibility": "Credibility and consistency of claims",
        "clarity": "Clarity of explanation",
    },
    SessionType.CUSTOM_QUESTION: {
        "relevance": "Relevance of answer to the question",
        "depth": "Depth of response",
        "structure": "Structure and clarity",
        "specificity": "Use of specific examples",
    },
}


def create_session_plan(
    session_type: SessionType,
    duration_minutes: int,
    mode: SessionMode,
    focus_area: str,
    context: CandidateContext,
    difficulty: Difficulty = Difficulty.MEDIUM,
) -> SessionPlan:
    """
    Build a SessionPlan for the given session type and duration.
    """
    total_seconds = duration_minutes * 60
    phases = _build_phases(session_type, total_seconds, focus_area, context)
    time_budget = {p.name: p.time_budget_seconds for p in phases}
    rubric = RUBRICS.get(session_type, RUBRICS[SessionType.CUSTOM_QUESTION])
    question_strategy = _question_strategy(session_type, mode, difficulty, context)
    primary_goal = _primary_goal(session_type, focus_area)

    plan = SessionPlan(
        session_type=session_type,
        phases=phases,
        time_budget_by_phase=time_budget,
        primary_goal=primary_goal,
        evaluation_rubric=rubric,
        question_strategy=question_strategy,
    )

    logger.info(
        "Session plan created: type=%s phases=%d total_seconds=%d",
        session_type.value, len(phases), total_seconds,
    )
    return plan


# ── Phase builders ────────────────────────────────────────────────────────────

def _build_phases(
    session_type: SessionType,
    total_seconds: int,
    focus_area: str,
    context: CandidateContext,
) -> list[SessionPhase]:
    builders = {
        SessionType.FULL_INTERVIEW: _phases_full_interview,
        SessionType.BEHAVIORAL_PRACTICE: _phases_behavioral,
        SessionType.TECHNICAL_CONCEPT_PRACTICE: _phases_technical_concept,
        SessionType.CODING_PRACTICE: _phases_coding,
        SessionType.RESUME_DEEP_DIVE: _phases_resume_deep_dive,
        SessionType.CUSTOM_QUESTION: _phases_custom_question,
    }
    builder = builders.get(session_type, _phases_custom_question)
    return builder(total_seconds, focus_area, context)


def _phases_full_interview(
    total_seconds: int, focus_area: str, context: CandidateContext
) -> list[SessionPhase]:
    # Default: 60 min = 3600s
    # 25 min behavioral/resume, 35 min coding
    t = total_seconds
    return [
        SessionPhase("INTRODUCTION", "Warm-up and introductions", int(t * 0.05)),
        SessionPhase("RESUME_DEEP_DIVE", "Probe resume projects and ownership", int(t * 0.15)),
        SessionPhase("BEHAVIORAL", "Behavioral and situational questions", int(t * 0.20)),
        SessionPhase("TECHNICAL_DISCUSSION", "Technical concepts and system design", int(t * 0.18)),
        SessionPhase("CODING_ROUND", "Live coding problem", int(t * 0.30)),
        SessionPhase("CODING_FOLLOWUPS", "Edge cases, complexity, optimizations", int(t * 0.07)),
        SessionPhase("FINAL_WRAP", "Candidate questions and closing", int(t * 0.03)),
        SessionPhase("REPORT_GENERATION", "Generating feedback report", 30),
    ]


def _phases_behavioral(
    total_seconds: int, focus_area: str, context: CandidateContext
) -> list[SessionPhase]:
    t = total_seconds
    return [
        SessionPhase(
            "INTRODUCTION_OR_PROMPT",
            f"Introduce the focus: {focus_area or 'behavioral question'}",
            int(t * 0.10),
        ),
        SessionPhase("BEHAVIORAL_RESPONSE", "Candidate answers the behavioral question", int(t * 0.50)),
        SessionPhase("FOLLOWUPS", "Follow-up probes on gaps and depth", int(t * 0.30)),
        SessionPhase("FEEDBACK", "Immediate coaching feedback", int(t * 0.10)),
    ]


def _phases_technical_concept(
    total_seconds: int, focus_area: str, context: CandidateContext
) -> list[SessionPhase]:
    t = total_seconds
    return [
        SessionPhase(
            "CONCEPT_EXPLANATION",
            f"Explain: {focus_area or 'the technical concept'}",
            int(t * 0.35),
        ),
        SessionPhase("DEPTH_FOLLOWUPS", "Deeper probes on implementation details", int(t * 0.30)),
        SessionPhase("TRADEOFFS", "Discuss tradeoffs and alternatives", int(t * 0.25)),
        SessionPhase("FEEDBACK", "Coaching feedback on explanation quality", int(t * 0.10)),
    ]


def _phases_coding(
    total_seconds: int, focus_area: str, context: CandidateContext
) -> list[SessionPhase]:
    t = total_seconds
    return [
        SessionPhase("PROBLEM_STATEMENT", "Present the coding problem", int(t * 0.08)),
        SessionPhase("APPROACH_DISCUSSION", "Discuss approach before coding", int(t * 0.15)),
        SessionPhase("CODING", "Live coding", int(t * 0.45)),
        SessionPhase("EDGE_CASES", "Edge cases and testing", int(t * 0.15)),
        SessionPhase("COMPLEXITY", "Time/space complexity analysis", int(t * 0.10)),
        SessionPhase("FEEDBACK", "Coding feedback", int(t * 0.07)),
    ]


def _phases_resume_deep_dive(
    total_seconds: int, focus_area: str, context: CandidateContext
) -> list[SessionPhase]:
    t = total_seconds
    # Pick up to 2 resume highlights to probe
    projects = context.resume_highlights[:2] if context.resume_highlights else ["your main project"]
    project_label = " and ".join(projects)
    return [
        SessionPhase("INTRODUCTION", "Set context for the deep dive", int(t * 0.08)),
        SessionPhase(
            "PROJECT_PROBE",
            f"Deep dive into: {project_label}",
            int(t * 0.55),
        ),
        SessionPhase("OWNERSHIP_CHALLENGE", "Challenge ownership and contribution claims", int(t * 0.25)),
        SessionPhase("FEEDBACK", "Feedback on depth and credibility", int(t * 0.12)),
    ]


def _phases_custom_question(
    total_seconds: int, focus_area: str, context: CandidateContext
) -> list[SessionPhase]:
    t = total_seconds
    return [
        SessionPhase(
            "QUESTION_PROMPT",
            f"Focus: {focus_area or 'custom question'}",
            int(t * 0.10),
        ),
        SessionPhase("RESPONSE", "Candidate response", int(t * 0.50)),
        SessionPhase("FOLLOWUPS", "Follow-up probes", int(t * 0.30)),
        SessionPhase("FEEDBACK", "Targeted feedback", int(t * 0.10)),
    ]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _primary_goal(session_type: SessionType, focus_area: str) -> str:
    goals = {
        SessionType.FULL_INTERVIEW: "Simulate a complete technical interview and identify hire/no-hire signals.",
        SessionType.BEHAVIORAL_PRACTICE: f"Practice and improve the behavioral response for: {focus_area or 'common behavioral questions'}.",
        SessionType.TECHNICAL_CONCEPT_PRACTICE: f"Assess depth of understanding for: {focus_area or 'the technical concept'}.",
        SessionType.CODING_PRACTICE: f"Evaluate coding approach, correctness, and communication for: {focus_area or 'a coding problem'}.",
        SessionType.RESUME_DEEP_DIVE: "Probe ownership, depth, and credibility of resume projects.",
        SessionType.CUSTOM_QUESTION: f"Conduct a focused mini-interview around: {focus_area}.",
    }
    return goals.get(session_type, f"Practice: {focus_area}")


def _question_strategy(
    session_type: SessionType,
    mode: SessionMode,
    difficulty: Difficulty,
    context: CandidateContext,
) -> str:
    base = f"Session type: {session_type.value}. Mode: {mode.value}. Difficulty: {difficulty.value}.\n"

    if session_type == SessionType.BEHAVIORAL_PRACTICE:
        base += "Use STAR probing. Ask for Situation, Task, Action, Result if missing. "
        base += "Probe for specificity and personal contribution."
    elif session_type == SessionType.TECHNICAL_CONCEPT_PRACTICE:
        base += "Start broad, then drill into implementation details. Ask for examples and tradeoffs."
    elif session_type == SessionType.CODING_PRACTICE:
        base += "Ask for approach before code. Probe edge cases and complexity after solution."
    elif session_type == SessionType.RESUME_DEEP_DIVE:
        base += "Challenge vague ownership claims. Ask 'what specifically did YOU do?'"
    elif session_type == SessionType.FULL_INTERVIEW:
        base += "Follow the phase plan. Adapt based on candidate performance."

    if context.risk_areas:
        base += f"\nKey risk areas to probe: {', '.join(context.risk_areas[:3])}."

    if mode == SessionMode.LEARNING:
        base += "\nIn learning mode: give hints when stuck, explain why you're probing."
    else:
        base += "\nIn professional mode: no hints, realistic pressure, concise responses."

    return base
