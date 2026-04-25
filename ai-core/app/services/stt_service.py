"""
STT service abstraction.
Pluggable interface — swap ElevenLabs / Deepgram / Whisper without changing callers.
"""
from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)


def is_mock_stt() -> bool:
    return os.getenv("MOCK_STT", "0") == "1"


async def transcribe_audio(audio_bytes: bytes, language: str = "en") -> str:
    """
    Transcribe audio bytes to text.
    Returns the transcript string.
    """
    if is_mock_stt():
        logger.debug("STT mock mode — returning placeholder transcript")
        return "[mock transcript] I think the answer involves using a hash map for O(1) lookups."

    # Try ElevenLabs STT first (if available)
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY", "")
    if elevenlabs_key:
        try:
            return await _transcribe_elevenlabs(audio_bytes, language)
        except Exception as exc:
            logger.warning("ElevenLabs STT failed, falling back to OpenAI Whisper: %s", exc)

    # Fall back to OpenAI Whisper
    openai_key = os.getenv("OPENAI_API_KEY", "")
    if openai_key:
        return await _transcribe_whisper(audio_bytes, language)

    raise RuntimeError("No STT provider available. Set ELEVENLABS_API_KEY or OPENAI_API_KEY.")


async def _transcribe_elevenlabs(audio_bytes: bytes, language: str) -> str:
    """Transcribe using ElevenLabs STT."""
    from elevenlabs.client import AsyncElevenLabs
    client = AsyncElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY", ""))

    # ElevenLabs STT API — adjust based on SDK version
    result = await client.speech_to_text.convert(
        audio=audio_bytes,
        language_code=language,
    )
    return result.text if hasattr(result, "text") else str(result)


async def _transcribe_whisper(audio_bytes: bytes, language: str) -> str:
    """Transcribe using OpenAI Whisper."""
    import io
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

    # Whisper expects a file-like object
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "audio.webm"

    transcript = await client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language=language,
    )
    return transcript.text
