"""
Deterministic mock LLM responses for local development and tests.
"""
from __future__ import annotations

import copy
import os
from typing import Any


MOCK_RESPONSES: dict[str, Any] = {
    "report_generator": {
        "summary": (
            "You showed strong API understanding and project ownership. "
            "Your main improvement areas are database reasoning, scaling trade-offs, "
            "and measurable impact. The follow-up on 10x traffic revealed a gap in "
            "horizontal scaling strategy that is worth focused practice."
        ),
        "strengths": [
            "Clear project ownership - you described your specific role and decisions.",
            "Good API-level thinking - you explained REST design choices confidently.",
            "Strong communication structure - answers were organized and easy to follow.",
        ],
        "gaps": [
            {
                "label": "Database scaling",
                "status": "open",
                "evidence": (
                    "Did not address horizontal scaling or sharding when asked "
                    "about 10x traffic."
                ),
            },
            {
                "label": "Metrics / measurable impact",
                "status": "improved",
                "evidence": (
                    "After probing, mentioned 40% query improvement but lacked "
                    "baseline comparison."
                ),
            },
            {
                "label": "System design trade-offs",
                "status": "open",
                "evidence": (
                    "Trade-offs were mentioned but not explained with specific reasoning."
                ),
            },
        ],
        "scores": {
            "role_alignment": 7,
            "technical_clarity": 6,
            "communication": 8,
            "evidence_strength": 5,
            "followup_recovery": 6,
        },
        "follow_up_analysis": [
            {
                "question": "How would your system handle 10x the current traffic?",
                "reason": (
                    "Original answer described the API but did not mention database "
                    "scaling or load distribution."
                ),
                "candidate_response_quality": "partial",
            },
            {
                "question": "Can you give me a specific metric from that project?",
                "reason": (
                    "Candidate mentioned impact but without any numbers or "
                    "before/after comparison."
                ),
                "candidate_response_quality": "partial",
            },
        ],
        "next_practice_plan": [
            "Review database indexing and caching strategies - practice explaining when to use each.",
            "Prepare one scale-focused project story: describe how you would handle 10x traffic on a system you built.",
            "Add measurable impact to your resume examples - every project story needs a number.",
            "Practice explaining technical trade-offs out loud: 'I chose X over Y because...'",
            "Study horizontal vs vertical scaling and be ready to draw a simple architecture diagram.",
        ],
    }
}


def is_mock_mode() -> bool:
    """Mock mode is on when MOCK_LLM=1 or no Groq API key is configured."""
    return os.getenv("MOCK_LLM") == "1" or not os.getenv("GROQ_API_KEY")


def get_mock_response(name: str) -> Any:
    """Return a defensive copy so callers can mutate safely."""
    if name not in MOCK_RESPONSES:
        raise KeyError(f"Unknown mock response: {name}")
    return copy.deepcopy(MOCK_RESPONSES[name])
