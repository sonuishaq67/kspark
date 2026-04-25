"""
FastAPI WebSocket endpoint for the interview audio loop.

Protocol (client → server):
  - Binary frames: raw audio bytes (PCM/WebM from MediaRecorder)
  - JSON text frame: {"type": "end_audio"} — signals client stopped recording

Protocol (server → client):
  - JSON text: {"type": "transcript", "text": "...", "is_final": bool}
  - JSON text: {"type": "agent_text", "text": "..."}
  - JSON text: {"type": "state", "value": "RUNNING_QUESTION|CLOSING|ENDED"}
  - JSON text: {"type": "error", "message": "..."}
  - Binary frames: MP3 audio chunks (TTS output)
"""
from __future__ import annotations

import asyncio
import json
import logging
import os

from fastapi import WebSocket, WebSocketDisconnect

from orchestrator.session_manager import process_turn
from orchestrator.state import get_session_state
from speech.asr import stream_audio
from speech.tts import synthesize

logger = logging.getLogger(__name__)

VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "")


async def handle_interview_websocket(websocket: WebSocket, session_id: str) -> None:
    """
    Main WebSocket handler for a live interview session.
    Manages the full duplex audio loop.
    """
    await websocket.accept()
    logger.info("WS connected: session=%s", session_id)

    # Verify session exists
    session = get_session_state(session_id)
    if not session:
        await _send_json(websocket, {"type": "error", "message": "Session not found"})
        await websocket.close()
        return

    # Queue for audio chunks received from the client
    audio_queue: asyncio.Queue[bytes | None] = asyncio.Queue()

    async def audio_source():
        """Async generator that yields audio bytes from the queue."""
        while True:
            chunk = await audio_queue.get()
            if chunk is None:
                break
            yield chunk

    async def on_transcript_chunk(text: str, is_final: bool) -> None:
        await _send_json(websocket, {
            "type": "transcript",
            "text": text,
            "is_final": is_final,
        })

    async def on_turn_end(final_transcript: str) -> None:
        """Called when Deepgram detects end of utterance."""
        logger.debug("Turn end: %s", final_transcript[:80])

        # Send thinking indicator
        await _send_json(websocket, {"type": "state", "value": "THINKING"})

        try:
            response = await process_turn(session_id, final_transcript)
        except Exception as exc:
            logger.error("process_turn error: %s", exc)
            await _send_json(websocket, {"type": "error", "message": str(exc)})
            return

        # Send agent text
        await _send_json(websocket, {
            "type": "agent_text",
            "text": response.utterance,
            "action": response.action,
        })

        # Send session state update
        current_session = get_session_state(session_id)
        if current_session:
            await _send_json(websocket, {
                "type": "state",
                "value": current_session.state.value,
                "current_question_index": current_session.current_question_index,
            })

        # Stream TTS audio
        try:
            async for audio_chunk in await synthesize(response.utterance, VOICE_ID):
                await websocket.send_bytes(audio_chunk)
        except Exception as exc:
            logger.warning("TTS error (non-fatal): %s", exc)

        # Signal TTS done
        await _send_json(websocket, {"type": "tts_done"})

    # Start ASR in a background task
    asr_task = asyncio.create_task(
        stream_audio(audio_source(), on_transcript_chunk, on_turn_end)
    )

    try:
        while True:
            message = await websocket.receive()

            if "bytes" in message:
                # Audio chunk from client
                await audio_queue.put(message["bytes"])

            elif "text" in message:
                data = json.loads(message["text"])
                if data.get("type") == "end_audio":
                    # Client stopped recording — signal end of audio stream
                    await audio_queue.put(None)

    except WebSocketDisconnect:
        logger.info("WS disconnected: session=%s", session_id)
    except Exception as exc:
        logger.error("WS error: %s", exc)
    finally:
        await audio_queue.put(None)   # unblock ASR task
        asr_task.cancel()
        try:
            await asr_task
        except asyncio.CancelledError:
            pass


async def _send_json(websocket: WebSocket, data: dict) -> None:
    try:
        await websocket.send_text(json.dumps(data))
    except Exception as exc:
        logger.warning("Failed to send WS message: %s", exc)
