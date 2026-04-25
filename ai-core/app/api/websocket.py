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
  code_review             — structured live review of latest code update
  latency_metrics         — turn timing metrics
  error                   — error notification
"""
from __future__ import annotations

import asyncio
import base64
import json
import logging

from fastapi import WebSocket, WebSocketDisconnect

from app.agents.question_generator import generate_candidate_questions
from app.agents.followup_selector import select_best_followup
from app.agents.response_generator import generate_response_stream, is_ghostwriting_attempt
from app.core.context_loader import load_context
from app.core.memory import add_turn
from app.core.orchestrator import advance_phase, end_session
from app.features.live_code_review import record_code_update, review_code
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

    # Track the in-flight code review so newer updates can cancel older ones
    # without blocking the inbound event loop (which also handles speech_ended).
    review_task: asyncio.Task | None = None
    send_lock = asyncio.Lock()

    async def safe_send(payload: dict) -> None:
        async with send_lock:
            await _send(websocket, payload)

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
                    await safe_send({
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

                await safe_send({
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
                    await safe_send({
                        "type": "interviewer_text_delta",
                        "delta": delta,
                        "is_final": False,
                    })

                full_response = "".join(full_response_parts)

                # Signal text complete
                await safe_send({
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
                        await safe_send({
                            "type": "interviewer_audio_chunk",
                            "data": base64.b64encode(audio_chunk).decode("utf-8"),
                        })

                # Signal TTS is fully streamed so the client knows when to play.
                await safe_send({"type": "interviewer_audio_complete"})

                tracker.mark_turn_complete()

                # Update memory
                phase_name = session.current_phase.name if session.current_phase else "UNKNOWN"
                add_turn(session, TurnRecord(speaker="candidate", transcript=final_transcript, phase=phase_name))
                add_turn(session, TurnRecord(speaker="interviewer", transcript=full_response, phase=phase_name))

                # Send latency metrics
                await safe_send({"type": "latency_metrics", **tracker.to_dict()})

            elif event_type == "code_update":
                code = event.get("code", "")
                language = event.get("language", "python")
                logger.debug("Code update: session=%s lang=%s len=%d", session_id, language, len(code))

                record_code_update(session, code, language)

                # Cancel any in-flight review so we don't pile up LLM calls
                # while the candidate keeps typing.
                if review_task and not review_task.done():
                    review_task.cancel()

                review_task = asyncio.create_task(
                    _run_code_review(safe_send, session, ctx, code, language)
                )

            elif event_type == "mode_update":
                new_mode = event.get("mode", "")
                if new_mode in ("learning", "professional"):
                    from app.models.session import SessionMode
                    session.mode = SessionMode(new_mode)
                    logger.info("Mode updated: session=%s mode=%s", session_id, new_mode)

            elif event_type == "end_session":
                # Cancel any pending code review so it can't fire after report.
                if review_task and not review_task.done():
                    review_task.cancel()
                report = await end_session(session_id)
                await safe_send({
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
    finally:
        if review_task and not review_task.done():
            review_task.cancel()
            try:
                await review_task
            except (asyncio.CancelledError, Exception):
                pass


async def _run_code_review(
    safe_send,
    session,
    ctx,
    code: str,
    language: str,
) -> None:
    """
    Run the LLM code review off the inbound event loop so it doesn't block
    speech/turn handling. Result is dropped silently if cancelled by a newer
    update or by disconnect.
    """
    try:
        review = await review_code(session, ctx, code, language)
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        logger.error("Code review failed: %s", exc, exc_info=True)
        return

    session.latest_code_review = review
    try:
        await safe_send({
            "type": "code_review",
            "language": language,
            "review": review,
        })
    except Exception as exc:
        logger.warning("code_review send failed: %s", exc)


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
