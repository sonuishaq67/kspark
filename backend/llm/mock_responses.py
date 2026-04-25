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
            "You demonstrated strong project ownership and clear communication structure throughout the interview. "
            "Your API design explanations were confident and well-organized. The main areas for improvement are "
            "database scaling strategies and providing measurable impact metrics. When probed about handling 10x "
            "traffic, you focused on application-layer solutions but didn't address database horizontal scaling or "
            "sharding, which is critical for senior-level roles."
        ),
        "strengths": [
            "Clear project ownership - you consistently described your specific role and technical decisions, not just team outcomes",
            "Strong communication structure - answers followed a logical flow (context → approach → outcome) without prompting",
            "Good API-level thinking - you explained REST design choices with confidence and justified your decisions",
            "Effective use of examples - when discussing the caching optimization, you provided concrete context about the problem",
        ],
        "gaps": [
            {
                "label": "Database horizontal scaling",
                "status": "open",
                "evidence": (
                    "When asked 'How would your system handle 10x the current traffic?', you mentioned load balancers "
                    "and caching but did not address database sharding, read replicas, or partitioning strategies. "
                    "This is a critical gap for senior backend roles."
                ),
            },
            {
                "label": "Quantifiable impact metrics",
                "status": "improved",
                "evidence": (
                    "Initially described project impact without numbers. After probing with 'Can you give me a specific metric?', "
                    "you mentioned 40% query improvement, but didn't provide baseline context (e.g., '40% reduction from 200ms to 120ms'). "
                    "Showed improvement but needs more precision."
                ),
            },
            {
                "label": "System design trade-offs",
                "status": "open",
                "evidence": (
                    "You mentioned choosing PostgreSQL over MongoDB but didn't explain the specific trade-offs considered "
                    "(e.g., ACID guarantees vs. horizontal scaling, schema flexibility vs. query performance). "
                    "Senior engineers are expected to articulate the 'why' behind architectural decisions."
                ),
            },
            {
                "label": "Distributed systems patterns",
                "status": "open",
                "evidence": (
                    "No mention of distributed systems concepts like eventual consistency, CAP theorem, or consensus algorithms "
                    "when discussing the microservices architecture. This suggests a gap in distributed systems fundamentals."
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
                    "Original answer focused on application-layer solutions (load balancing, caching) but did not address "
                    "database scaling, which is typically the bottleneck at scale. Wanted to probe database architecture knowledge."
                ),
                "candidate_response_quality": "partial",
            },
            {
                "question": "Can you give me a specific metric from that project?",
                "reason": (
                    "Candidate mentioned 'significant improvement' and 'better performance' but without quantifiable data. "
                    "Senior engineers should have metrics readily available to demonstrate impact."
                ),
                "candidate_response_quality": "partial",
            },
            {
                "question": "What trade-offs did you consider when choosing PostgreSQL?",
                "reason": (
                    "Candidate stated the choice but didn't explain the reasoning. Wanted to understand depth of "
                    "architectural decision-making and awareness of trade-offs."
                ),
                "candidate_response_quality": "weak",
            },
        ],
        "next_practice_plan": [
            "Study database scaling patterns: read about sharding strategies (hash-based, range-based, geographic), read replicas, and write scaling. Practice explaining when to use each approach.",
            "Prepare a 'scale story' for your main project: write out how you would handle 10x traffic, covering application layer, database layer, and infrastructure. Practice delivering this in 2-3 minutes.",
            "Add quantifiable metrics to every project story: go through your resume and add specific numbers (latency improvements, throughput increases, cost savings, user impact). Format as 'reduced X from Y to Z'.",
            "Practice the trade-off framework: for each technical decision in your projects, write down 2-3 alternatives you considered and why you chose your approach. Practice explaining this out loud.",
            "Review distributed systems fundamentals: study CAP theorem, eventual consistency, and consensus algorithms (Raft, Paxos). Be ready to explain how these apply to your microservices architecture.",
        ],
    }
}


def is_mock_mode() -> bool:
    """Mock mode is on when MOCK_LLM=1 or no OpenAI API key is configured."""
    return os.getenv("MOCK_LLM") == "1" or not os.getenv("OPENAI_API_KEY")


def get_mock_response(name: str) -> Any:
    """Return a defensive copy so callers can mutate safely."""
    if name not in MOCK_RESPONSES:
        raise KeyError(f"Unknown mock response: {name}")
    return copy.deepcopy(MOCK_RESPONSES[name])
