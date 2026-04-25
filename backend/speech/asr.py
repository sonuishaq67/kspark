"""
Deepgram Nova-3 streaming ASR client.
MOCK_ASR=1 replays mock_transcripts.py on a timer instead.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Awaitable, Callable

logger = logging.getLogger(__name__)


def _mock_mode() -> bool:
    return os.getenv("MOCK_ASR", "0") == "1"


async def stream_audio(
    audio_source,                                    # async iterator of bytes OR a WebSocket
    on_transcript_chunk: Callable[[str, bool], Awaitable[None]],  # (text, is_final)
    on_turn_end: Callable[[str], Awaitable[None]],   # (final_transcript)
) -> None:
    """
    Stream audio to Deepgram and call callbacks on transcript events.
    In MOCK_ASR mode, replays mock transcripts on a timer.
    """
    if _mock_mode():
        await _mock_stream(on_transcript_chunk, on_turn_end)
        return

    await _deepgram_stream(audio_source, on_transcript_chunk, on_turn_end)


async def _mock_stream(
    on_transcript_chunk: Callable[[str, bool], Awaitable[None]],
    on_turn_end: Callable[[str], Awaitable[None]],
) -> None:
    """Replay mock transcripts with delays."""
    from speech.mock_transcripts import MOCK_SEQUENCE

    logger.info("MOCK_ASR: replaying %d mock turns", len(MOCK_SEQUENCE))

    for transcript, delay in MOCK_SEQUENCE:
        await asyncio.sleep(delay)
        # Emit as interim first
        await on_transcript_chunk(transcript, False)
        await asyncio.sleep(0.3)
        # Then as final (end of turn)
        await on_transcript_chunk(transcript, True)
        await on_turn_end(transcript)
        # Pause between turns
        await asyncio.sleep(1.5)


async def _deepgram_stream(
    audio_source,
    on_transcript_chunk: Callable[[str, bool], Awaitable[None]],
    on_turn_end: Callable[[str], Awaitable[None]],
) -> None:
    """Stream audio to Deepgram Nova-3 via WebSocket."""
    api_key = os.getenv("DEEPGRAM_API_KEY", "")
    if not api_key:
        raise RuntimeError("DEEPGRAM_API_KEY is not set")

    try:
        from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions

        dg_client = DeepgramClient(api_key)
        dg_connection = dg_client.listen.asynclive.v("1")

        accumulated: list[str] = []

        async def on_message(self, result, **kwargs):
            sentence = result.channel.alternatives[0].transcript
            if not sentence:
                return
            is_final = result.is_final
            await on_transcript_chunk(sentence, is_final)
            if is_final:
                accumulated.append(sentence)

        async def on_utterance_end(self, utterance_end, **kwargs):
            full_transcript = " ".join(accumulated).strip()
            accumulated.clear()
            if full_transcript:
                await on_turn_end(full_transcript)

        dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
        dg_connection.on(LiveTranscriptionEvents.UtteranceEnd, on_utterance_end)

        options = LiveOptions(
            model="nova-3",
            language="en-US",
            smart_format=True,
            interim_results=True,
            utterance_end_ms="1500",
            vad_events=True,
            endpointing=500,
        )

        await dg_connection.start(options)

        # Feed audio bytes from the source
        async for chunk in audio_source:
            if isinstance(chunk, bytes):
                await dg_connection.send(chunk)

        await dg_connection.finish()

    except Exception as exc:
        logger.error("Deepgram ASR error: %s", exc)
        raise
