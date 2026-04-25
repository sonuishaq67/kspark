"""
OpenAI service wrapper.
Supports streaming and non-streaming chat completions.
Falls back to mock responses when MOCK_LLM=1 or OPENAI_API_KEY is absent.
"""
from __future__ import annotations

import json
import logging
import os
from collections.abc import AsyncGenerator
from typing import Any

logger = logging.getLogger(__name__)

# Lazy import — only load openai if actually needed
_client = None


def _get_client():
    global _client
    if _client is None:
        from openai import AsyncOpenAI
        api_key = os.getenv("OPENAI_API_KEY", "")
        _client = AsyncOpenAI(api_key=api_key)
    return _client


def is_mock_mode() -> bool:
    return os.getenv("MOCK_LLM", "0") == "1" or not os.getenv("OPENAI_API_KEY", "")


async def chat(
    messages: list[dict[str, str]],
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> str:
    """Non-streaming chat completion. Returns full response string."""
    if is_mock_mode():
        return _mock_response(messages)

    if model is None:
        model = os.getenv("OPENAI_MODEL", "gpt-4o")

    client = _get_client()
    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    content = response.choices[0].message.content or ""
    logger.debug("OpenAI response tokens=%s", response.usage)
    return content


async def chat_json(
    messages: list[dict[str, str]],
    model: str | None = None,
) -> dict[str, Any]:
    """Chat with JSON mode enforced. Returns parsed dict."""
    if is_mock_mode():
        raw = _mock_response(messages)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"kind": "partial", "gap_addressed": None}

    if model is None:
        model = os.getenv("OPENAI_FAST_MODEL", "gpt-4o-mini")

    client = _get_client()
    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.2,
        max_tokens=512,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content or "{}"
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("OpenAI returned non-JSON: %s", raw)
        raise ValueError(f"LLM returned non-JSON: {raw}") from exc


async def chat_stream(
    messages: list[dict[str, str]],
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> AsyncGenerator[str, None]:
    """
    Streaming chat completion.
    Yields text deltas as they arrive.
    """
    if is_mock_mode():
        # Simulate streaming by yielding word by word
        mock = _mock_response(messages)
        for word in mock.split():
            yield word + " "
        return

    if model is None:
        model = os.getenv("OPENAI_MODEL", "gpt-4o")

    client = _get_client()
    stream = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


# ── Mock responses ────────────────────────────────────────────────────────────

_MOCK_RESPONSES = {
    "session_planner": '{"phases": [], "primary_goal": "Mock session plan", "question_strategy": "Ask probing questions"}',
    "interviewer": "That's a good start. Can you walk me through the specific steps you took and what the outcome was?",
    "question_generator": json.dumps({
        "questions": [
            {"question": "Can you quantify the impact of that decision?", "reason": "Missing metrics", "phase": "BEHAVIORAL", "priority_score": 0.9, "question_type": "probe"},
            {"question": "What would you do differently now?", "reason": "Reflection gap", "phase": "BEHAVIORAL", "priority_score": 0.8, "question_type": "probe"},
            {"question": "How did your teammates respond?", "reason": "Team dynamics", "phase": "BEHAVIORAL", "priority_score": 0.7, "question_type": "behavioral"},
        ]
    }),
    "followup_selector": '{"selected_question": "Can you quantify the impact of that decision?", "reason": "Missing metrics in the answer"}',
    "evaluator": json.dumps({
        "overall_score": 7.2,
        "metric_scores": [
            {"metric": "communication", "score": 8.0, "rationale": "Clear and structured"},
            {"metric": "technical_depth", "score": 6.5, "rationale": "Good surface level, needs more depth"},
        ],
        "strengths": ["Clear communication", "Good problem framing"],
        "weaknesses": ["Missing quantifiable metrics", "Shallow on tradeoffs"],
        "best_answer": "The rate limiter explanation was solid.",
        "weakest_answer": "The scaling answer lacked specifics.",
        "improved_answer_example": "I would add: 'We reduced latency by 40% by switching to Redis-based token buckets.'",
        "action_plan": ["Practice quantifying impact", "Study distributed systems tradeoffs"],
    }),
    "coding_evaluator": json.dumps({
        "overall_score": 6.8,
        "metric_scores": [
            {"metric": "approach", "score": 7.5, "rationale": "Good initial decomposition"},
            {"metric": "correctness", "score": 6.0, "rationale": "Solution had an off-by-one error"},
        ],
        "strengths": ["Good approach discussion", "Identified main edge cases"],
        "weaknesses": ["Off-by-one in loop bounds", "Didn't analyze space complexity"],
        "best_answer": "The approach discussion was well-structured.",
        "weakest_answer": "The final implementation had a bug.",
        "improved_answer_example": "Use `i < n` instead of `i <= n` in the loop condition.",
        "action_plan": ["Practice loop boundary conditions", "Always state space complexity"],
    }),
    "code_reviewer": json.dumps({
        "summary": "The structure is a reasonable start, but there is one likely edge case to check before moving on.",
        "status": "needs_attention",
        "issues": [
            {
                "severity": "warning",
                "line": None,
                "category": "edge_case",
                "message": "The current logic does not clearly handle empty or single-item input.",
                "hint": "Try walking through the smallest possible input by hand.",
            }
        ],
        "next_prompt": "What should this return for the smallest valid input?",
    }),
    "default": "I see. Can you tell me more about that?",
}


def _mock_response(messages: list[dict[str, str]]) -> str:
    """Return a deterministic mock response based on the system prompt content."""
    system_content = ""
    for m in messages:
        if m.get("role") == "system":
            system_content = m.get("content", "").lower()
            break

    keys = sorted(
        (key for key in _MOCK_RESPONSES if key != "default"),
        key=len,
        reverse=True,
    )
    for key in keys:
        if key in system_content:
            return _MOCK_RESPONSES[key]

    return _MOCK_RESPONSES["default"]
