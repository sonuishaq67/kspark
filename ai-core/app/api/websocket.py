"""
WebSocket handler for real-time interview streaming.

Client → Server events:
  transcript_chunk   — partial transcript while user speaks
  speech_started     — user started speaking
  speech_ended       — user stopped speaking (includes final transcript)
  audio_chunk        — raw audio bytes (base64) for STT
  code_update        — code editor update (coding sessions)
  mode_update        — switch learning/professional mid-session
  end_session        — client requests session end

Server → Client events:
  interviewer_text_delta  — streaming text token
  interviewer_audio_chunk — streaming TTS audio
  selected_question       — which question was selected
  phase_update            — phase transition notification
  timer_update            — time remaining
  report_ready            — report generation complete
  latency_metrics         — turn timing metrics
  error                   — error notification
"""
from __future__ import annotations

import asyncio
import base64
import json
import logging
import time

from fastapi import WebSocket, WebSocketDisconnect

from app.agents.question_generator import generate_candidate_questions
from app.agents.followup_selector import select_best_followup
from app.agents.response_generator import generate_response_stream, is_ghostwriting_attempt
from app.core.context_loader import load_context
from app.core.memory import add_turn
from app.core.orchestrator import advance_phase, end_session
from app.models.session import TurnRecord, get_session
from app.services.stt_service import transcribe_audio
from app.services.tts_service import synthesize_stream
from app.utils.latency import LatencyTracker

logger = logging.getLogger(__name__)


async def handle_websocket(websocket: WebSocket, session_id: str) -> None:
    """
    Main WebSocket handler for a session.
    Manages the full real-time interview loop.
    """
    await websocket.accept()
    logger.info("WebSocket connected: session=%s", session_id)

    session = get_session(session_id)
    if not session:
        await _send(websocket, {"type": "error", "code": "SESSION_NOT_FOUND", "message": f"Session {session_id} not found"})
        await websocket.close()
        return

    ctx = load_context(
        context_file_text=session.context_file_text,
        resume=session.resume,
        job_description=session.job_description,
        company=session.company,
        role_type=session.role_type,
    )

    # Send initial phase info
    await _send_phase_update(websocket, session)

    try:
        while True:
            raw = await websocket.receive_text()
            event = json.loads(raw)
            event_type = event.get("type", "")

            if event_type == "speech_started":
                session.live_transcript_buffer = ""
                logger.debug("Speech started: session=%s", session_id)

            elif event_type == "transcript_chunk":
                chunk = event.get("text", "")
                session.live_transcript_buffer += " " + chunk
                # Fire background question generation
                asyncio.create_task(
                    generate_candidate_questions(session, ctx, session.live_transcript_buffer)
                )

            elif event_type == "audio_chunk":
                # Decode and transcribe audio
                audio_b64 = event.get("data", "")
                if audio_b64:
                    audio_bytes = base64.b64decode(audio_b64)
                    transcript = await transcribe_audio(audio_bytes)
                    session.live_transcript_buffer += " " + transcript
                    # Send partial transcript back
                    await _send(websocket, {
                        "type": "transcript_chunk",
                        "text": transcript,
                        "is_final": False,
                    })

            elif event_type == "speech_ended":
                tracker = LatencyTracker(session_id=session_id)
                tracker.mark_speech_end()

                final_transcript = event.get("final_transcript", "").strip()
                if not final_transcript:
                    final_transcript = session.live_transcript_buffer.strip()
                session.live_transcript_buffer = ""

                # Select best follow-up
                selected = await select_best_followup(session, final_transcript)
                tracker.mark_question_selected()

                await _send(websocket, {
                    "type": "selected_question",
                    "question": selected,
                    "phase": session.current_phase.name if session.current_phase else "UNKNOWN",
                })

                # Stream interviewer response
                full_response_parts = []
                first_token = True

                async for delta in generate_response_stream(
                    session=session,
                    context=ctx,
                    selected_question=selected,
                    final_transcript=final_transcript,
                ):
                    if first_token:
                        tracker.mark_first_token()
                        first_token = False
                    full_response_parts.append(delta)
                    await _send(websocket, {
                        "type": "interviewer_text_delta",
                        "delta": delta,
                        "is_final": False,
                    })

                full_response = "".join(full_response_parts)

                # Signal text complete
                await _send(websocket, {
                    "type": "interviewer_text_delta",
                    "delta": "",
                    "is_final": True,
                })

                # Stream TTS audio
                first_audio = True
                async for audio_chunk in synthesize_stream(full_response):
                    if audio_chunk:
                        if first_audio:
                            tracker.mark_first_audio()
                            first_audio = False
                        await _send(websocket, {
                            "type": "interviewer_audio_chunk",
                            "data": base64.b64encode(audio_chunk).decode("utf-8"),
                        })

                tracker.mark_turn_complete()

                # Update memory
                phase_name = session.current_phase.name if session.current_phase else "UNKNOWN"
                add_turn(session, TurnRecord(speaker="candidate", transcript=final_transcript, phase=phase_name))
                add_turn(session, TurnRecord(speaker="interviewer", transcript=full_response, phase=phase_name))

                # Send latency metrics
                await _send(websocket, {"type": "latency_metrics", **tracker.to_dict()})

            elif event_type == "code_update":
                # Store code update in session for coding sessions
                code = event.get("code", "")
                language = event.get("language", "python")
                logger.debug("Code update: session=%s lang=%s len=%d", session_id, language, len(code))
                # Append as a special turn for the evaluator
                add_turn(session, TurnRecord(
                    speaker="candidate",
                    transcript=f"[CODE UPDATE - {language}]\n{code}",
                    phase=session.current_phase.name if session.current_phase else "CODING",
                ))

            elif event_type == "mode_update":
                new_mode = event.get("mode", "")
                if new_mode in ("learning", "professional"):
                    from app.models.session import SessionMode
                    session.mode = SessionMode(new_mode)
                    logger.info("Mode updated: session=%s mode=%s", session_id, new_mode)

            elif event_type == "end_session":
                report = await end_session(session_id)
                await _send(websocket, {
                    "type": "report_ready",
                    "session_id": session_id,
                    "report": report.model_dump(),
                })
                break

            else:
                logger.warning("Unknown event type: %s", event_type)

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected: session=%s", session_id)
    except Exception as exc:
        logger.error("WebSocket error: session=%s error=%s", session_id, exc, exc_info=True)
        try:
            await _send(websocket, {"type": "error", "code": "INTERNAL_ERROR", "message": str(exc)})
        except Exception:
            pass


async def _send(websocket: WebSocket, data: dict) -> None:
    """Send a JSON event to the client."""
    try:
        await websocket.send_text(json.dumps(data))
    except Exception as exc:
        logger.warning("Failed to send WebSocket message: %s", exc)


async def _send_phase_update(websocket: WebSocket, session) -> None:
    """Send the current phase info to the client."""
    if not session.session_plan:
        return
    current = session.current_phase
    if not current:
        return
    await _send(websocket, {
        "type": "phase_update",
        "phase": current.name,
        "description": current.description,
        "phase_index": session.current_phase_index,
        "total_phases": len(session.session_plan.phases),
    })
