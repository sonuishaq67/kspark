"""
Groq LLM client wrapper.
Uses llama-3.3-70b for reasoning and llama-3.1-8b for cheap classifier calls.
"""
from __future__ import annotations

import json
import logging
import os
from typing import Any

from groq import AsyncGroq

logger = logging.getLogger(__name__)

REASONING_MODEL = "llama-3.3-70b-versatile"
CLASSIFIER_MODEL = "llama-3.1-8b-instant"

_client: AsyncGroq | None = None


def _get_client() -> AsyncGroq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set")
        _client = AsyncGroq(api_key=api_key)
    return _client


async def chat(
    messages: list[dict[str, str]],
    model: str = REASONING_MODEL,
    response_format: dict[str, str] | None = None,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> str:
    """
    Send a chat completion request to Groq.
    Returns the assistant message content as a string.
    """
    client = _get_client()

    kwargs: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if response_format:
        kwargs["response_format"] = response_format

    logger.debug("Groq request model=%s messages=%d", model, len(messages))

    response = await client.chat.completions.create(**kwargs)
    content = response.choices[0].message.content or ""

    logger.debug("Groq response tokens=%s", response.usage)
    return content


async def chat_json(
    messages: list[dict[str, str]],
    model: str = CLASSIFIER_MODEL,
) -> dict[str, Any]:
    """
    Chat with JSON mode enforced. Returns parsed dict.
    Raises ValueError if the response is not valid JSON.
    """
    raw = await chat(
        messages=messages,
        model=model,
        response_format={"type": "json_object"},
        temperature=0.2,   # low temp for deterministic classification
        max_tokens=256,
    )
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("Groq returned non-JSON: %s", raw)
        raise ValueError(f"LLM returned non-JSON response: {raw}") from exc
