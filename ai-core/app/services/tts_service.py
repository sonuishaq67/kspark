"""
TTS service abstraction.
Primary: ElevenLabs streaming TTS.
Fallback: mock mode (returns empty bytes).
"""
from __future__ import annotations

import base64
import logging
import os
from collections.abc import AsyncGenerator

logger = logging.getLogger(__name__)


def is_mock_tts() -> bool:
    return os.getenv("MOCK_TTS", "0") == "1" or not os.getenv("ELEVENLABS_API_KEY", "")


async def synthesize_stream(text: str) -> AsyncGenerator[bytes, None]:
    """
    Stream TTS audio chunks for the given text.
    Yields raw audio bytes (MP3).
    """
    if is_mock_tts():
        logger.debug("TTS mock mode — returning empty audio")
        # Yield a tiny silent MP3 frame so the client doesn't hang
        yield b""
        return

    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
    model_id = os.getenv("ELEVENLABS_MODEL_ID", "eleven_turbo_v2_5")

    try:
        from elevenlabs.client import AsyncElevenLabs
        client = AsyncElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY", ""))

        audio_stream = await client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id=model_id,
            output_format="mp3_44100_128",
        )

        async for chunk in audio_stream:
            if chunk:
                yield chunk

    except Exception as exc:
        logger.error("ElevenLabs TTS error: %s", exc)
        yield b""


async def synthesize_bytes(text: str) -> bytes:
    """Collect all TTS chunks into a single bytes object."""
    chunks = []
    async for chunk in synthesize_stream(text):
        chunks.append(chunk)
    return b"".join(chunks)


async def synthesize_base64(text: str) -> str:
    """Return TTS audio as a base64-encoded string (for WebSocket transport)."""
    audio = await synthesize_bytes(text)
    return base64.b64encode(audio).decode("utf-8")
