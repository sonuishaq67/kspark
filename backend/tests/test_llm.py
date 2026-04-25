"""
Unit tests for LLM client and prompt loading.
Mocks the Groq client — no real API calls.
"""
from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


# ── prompt loading ────────────────────────────────────────────────────────────

def test_get_prompt_loads_file(tmp_path, monkeypatch):
    """get_prompt should load and return the content of a .md file."""
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()
    (prompts_dir / "test_prompt.md").write_text("Hello, world!")

    import llm.prompts as prompts_module
    monkeypatch.setattr(prompts_module, "_PROMPTS_DIR", prompts_dir)
    prompts_module._cache.clear()

    result = prompts_module.get_prompt("test_prompt")
    assert result == "Hello, world!"


def test_get_prompt_raises_on_missing(tmp_path, monkeypatch):
    """get_prompt should raise KeyError for unknown prompt names."""
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()

    import llm.prompts as prompts_module
    monkeypatch.setattr(prompts_module, "_PROMPTS_DIR", prompts_dir)
    prompts_module._cache.clear()

    with pytest.raises(KeyError, match="nonexistent"):
        prompts_module.get_prompt("nonexistent")


# ── chat_json ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_chat_json_returns_parsed_dict():
    """chat_json should parse the LLM response as JSON."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '{"kind": "partial", "gap_addressed": null}'
    mock_response.usage = MagicMock()

    with patch("llm.client._get_client") as mock_get_client:
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        mock_get_client.return_value = mock_client

        from llm.client import chat_json
        result = await chat_json([{"role": "user", "content": "test"}])

    assert result == {"kind": "partial", "gap_addressed": None}


@pytest.mark.asyncio
async def test_chat_json_raises_on_invalid_json():
    """chat_json should raise ValueError if the response is not valid JSON."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "This is not JSON"
    mock_response.usage = MagicMock()

    with patch("llm.client._get_client") as mock_get_client:
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        mock_get_client.return_value = mock_client

        from llm.client import chat_json
        with pytest.raises(ValueError, match="non-JSON"):
            await chat_json([{"role": "user", "content": "test"}])


@pytest.mark.asyncio
async def test_chat_returns_string():
    """chat should return the assistant message content as a string."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "This is a probe question."
    mock_response.usage = MagicMock()

    with patch("llm.client._get_client") as mock_get_client:
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        mock_get_client.return_value = mock_client

        from llm.client import chat
        result = await chat([{"role": "user", "content": "test"}])

    assert result == "This is a probe question."
    assert isinstance(result, str)
    assert len(result) > 0
