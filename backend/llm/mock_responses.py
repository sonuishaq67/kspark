"""
Deterministic mock LLM responses for local development and tests.
"""
from __future__ import annotations

import copy
import os
from typing import Any


MOCK_RESPONSES: dict[str, Any] = {
    "readiness_analysis": {
        "readiness_score": 65,
        "summary": (
            "Solid mid-level engineer with 3 years of Python experience and strong "
            "microservices background. Has mentoring experience but lacks distributed "
            "systems depth and Kubernetes expertise. Needs preparation on system design "
            "at scale and Go programming."
        ),
        "strong_matches": [
            {
                "label": "Python Development",
                "evidence": "3 years of Python experience, built microservices serving 1M+ users",
            },
            {
                "label": "Performance Optimization",
                "evidence": "Reduced API latency by 40% through caching optimization",
            },
            {
                "label": "Real-time Systems",
                "evidence": "Built real-time chat feature using WebSockets and Redis",
            },
            {
                "label": "CI/CD",
                "evidence": "Implemented CI/CD pipeline reducing deployment time by 60%",
            },
        ],
        "partial_matches": [
            {
                "label": "Mentoring",
                "evidence": "Mentored 3 junior engineers but lacks details on scope and impact",
            },
            {
                "label": "Microservices Architecture",
                "evidence": "Built microservices but no mention of service mesh or distributed patterns",
            },
            {
                "label": "Cloud Platforms",
                "evidence": "Mentions AWS but no details on specific services or scale",
            },
        ],
        "missing_or_weak": [
            {
                "label": "Kubernetes",
                "evidence": None,
            },
            {
                "label": "Go Programming",
                "evidence": None,
            },
            {
                "label": "Distributed Systems Design",
                "evidence": "No mention of CAP theorem, consensus algorithms, or distributed patterns",
            },
            {
                "label": "High-Traffic API Design",
                "evidence": "1M users mentioned but no details on request volume or scaling strategies",
            },
            {
                "label": "System Design at Scale",
                "evidence": "No examples of designing systems for 10M+ requests/day",
            },
        ],
        "interview_focus_areas": [
            "Distributed systems knowledge (consensus, replication, partitioning)",
            "System design for high-traffic APIs (10M+ requests/day)",
            "Kubernetes and container orchestration experience",
        ],
        "prep_brief": [
            "Review distributed systems fundamentals: CAP theorem, consistency models, consensus algorithms (Raft, Paxos)",
            "Study Kubernetes basics: pods, services, deployments, and how to orchestrate microservices",
            "Prepare system design case study: design a high-traffic API (10M+ req/day) with caching, load balancing, and failover",
            "Expand your mentoring story: quantify impact (e.g., 'mentored 3 engineers who shipped X feature in Y weeks')",
            "Learn Go basics: syntax, concurrency patterns (goroutines, channels), and compare to Python",
        ],
    },
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
