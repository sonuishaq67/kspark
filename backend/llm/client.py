"""
OpenAI LLM client wrapper.
Uses gpt-4o for reasoning and gpt-4o-mini for cheap classifier calls.
"""
from __future__ import annotations

import json
import logging
import os
from typing import Any

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

REASONING_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
CLASSIFIER_MODEL = os.getenv("OPENAI_FAST_MODEL", "gpt-4o-mini")

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")
        _client = AsyncOpenAI(api_key=api_key)
    return _client


async def chat(
    messages: list[dict[str, str]],
    model: str = REASONING_MODEL,
    response_format: dict[str, str] | None = None,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> str:
    """
    Send a chat completion request to OpenAI.
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

    logger.debug("OpenAI request model=%s messages=%d", model, len(messages))

    response = await client.chat.completions.create(**kwargs)
    content = response.choices[0].message.content or ""

    logger.debug("OpenAI response tokens=%s", response.usage)
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
        logger.error("OpenAI returned non-JSON: %s", raw)
        raise ValueError(f"LLM returned non-JSON response: {raw}") from exc
