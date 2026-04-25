"""
ElevenLabs TTS client.
MOCK_TTS=1 yields empty bytes (silent mode — text still shows in UI).
"""
from __future__ import annotations

import logging
import os
from typing import AsyncIterator

logger = logging.getLogger(__name__)


def _mock_mode() -> bool:
    return os.getenv("MOCK_TTS", "0") == "1"


async def synthesize(text: str, voice_id: str | None = None) -> AsyncIterator[bytes]:
    """Stream MP3 audio bytes for the given text."""
    if _mock_mode():
        logger.debug("MOCK_TTS: skipping synthesis for: %s", text[:60])
        return _empty_stream()

    _voice_id = voice_id or os.getenv("ELEVENLABS_VOICE_ID", "")
    api_key = os.getenv("ELEVENLABS_API_KEY", "")

    if not api_key or not _voice_id:
        logger.warning("ElevenLabs not configured — falling back to silent mode")
        return _empty_stream()

    return _elevenlabs_stream(text, _voice_id, api_key)


async def _empty_stream() -> AsyncIterator[bytes]:
    """Yield nothing — silent mode."""
    return
    yield  # make it a generator


async def _elevenlabs_stream(text: str, voice_id: str, api_key: str) -> AsyncIterator[bytes]:
    """Stream MP3 chunks from ElevenLabs."""
    try:
        from elevenlabs.client import AsyncElevenLabs
        from elevenlabs import VoiceSettings

        client = AsyncElevenLabs(api_key=api_key)
        audio_stream = await client.generate(
            text=text,
            voice=voice_id,
            model="eleven_turbo_v2",
            voice_settings=VoiceSettings(stability=0.5, similarity_boost=0.75),
            stream=True,
        )
        async for chunk in audio_stream:
            if chunk:
                yield chunk
    except Exception as exc:
        logger.error("ElevenLabs TTS error: %s", exc)
        return
