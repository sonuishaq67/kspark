"""
AI Core microservice — FastAPI entry point.

Supports:
  - FULL_INTERVIEW
  - BEHAVIORAL_PRACTICE
  - TECHNICAL_CONCEPT_PRACTICE
  - CODING_PRACTICE
  - RESUME_DEEP_DIVE
  - CUSTOM_QUESTION

Run locally:
  cd ai-core
  uvicorn app.main:app --reload --port 8001
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

# Load .env from the ai-core directory before any os.getenv reads happen.
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH, override=False)

from app.utils.logging import setup_logging

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Core microservice...")

    # Pre-load prompts
    from app.utils.prompts import reload_prompts
    reload_prompts()
    logger.info("Prompts loaded")

    yield

    logger.info("AI Core shutting down")


app = FastAPI(
    title="AI Core — Interview & Practice Engine",
    version="1.0.0",
    description="Reusable AI Core service powering mock interviews and targeted practice sessions.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────

from app.api.sessions import router as sessions_router
app.include_router(sessions_router)


@app.websocket("/sessions/{session_id}/stream")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """Real-time interview stream — handles audio, transcript, and TTS."""
    from app.api.websocket import handle_websocket
    await handle_websocket(websocket, session_id)


@app.get("/health")
async def health():
    from app.services.openai_service import is_mock_mode
    from app.services.tts_service import is_mock_tts
    from app.services.stt_service import is_mock_stt
    return {
        "status": "ok",
        "mock_llm": is_mock_mode(),
        "mock_tts": is_mock_tts(),
        "mock_stt": is_mock_stt(),
    }


@app.get("/session-types")
async def list_session_types():
    """List all supported session types with descriptions."""
    return {
        "session_types": [
            {"type": "FULL_INTERVIEW", "description": "Complete mock interview (behavioral + technical + coding)", "default_duration_minutes": 60},
            {"type": "BEHAVIORAL_PRACTICE", "description": "Targeted behavioral question practice", "default_duration_minutes": 15},
            {"type": "TECHNICAL_CONCEPT_PRACTICE", "description": "Explain and defend a technical concept", "default_duration_minutes": 20},
            {"type": "CODING_PRACTICE", "description": "LeetCode-style coding round with follow-ups", "default_duration_minutes": 45},
            {"type": "RESUME_DEEP_DIVE", "description": "Deep probe of resume projects and ownership", "default_duration_minutes": 30},
            {"type": "CUSTOM_QUESTION", "description": "Focused mini-interview around a custom question", "default_duration_minutes": 15},
        ]
    }


@app.post("/tts")
async def text_to_speech(body: dict):
    """Convert text to speech. Returns base64-encoded MP3 audio."""
    import base64
    from app.services.tts_service import synthesize_bytes
    text = body.get("text", "")
    if not text:
        return {"audio": ""}
    audio = await synthesize_bytes(text)
    return {"audio": base64.b64encode(audio).decode("utf-8")}
