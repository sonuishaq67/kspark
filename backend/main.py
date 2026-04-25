"""
Interview Coach — FastAPI backend entry point.
Single process: orchestrator + speech + LLM + config all in-process.
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

# ── logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


# ── startup / shutdown ────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Interview Coach backend...")

    # Init DB
    from db.init import init_db
    await init_db()
    logger.info("Database ready")

    # Load configs
    from config.loader import load_all_configs
    load_all_configs()
    logger.info("Configs loaded")

    # Pre-load questions
    from questions.loader import get_all_questions
    questions = get_all_questions()
    logger.info("Loaded %d demo questions", len(questions))

    # Pre-load prompts
    from llm.prompts import reload_prompts
    reload_prompts()
    logger.info("Prompts loaded")

    yield

    logger.info("Shutting down...")


# ── app ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Interview Coach API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow Next.js dev server and production origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}


# Session REST API
from api.sessions import router as sessions_router
app.include_router(sessions_router)

# Readiness / Gap Analysis API
from api.readiness import router as readiness_router
app.include_router(readiness_router)

# Research API (Tavily-backed context preparation)
from api.research import router as research_router
app.include_router(research_router)

# Resume parsing API
from api.resume import router as resume_router
app.include_router(resume_router)


# WebSocket interview endpoint
from speech.websocket_handler import handle_interview_websocket

@app.websocket("/ws/interview/{session_id}")
async def interview_ws(websocket: WebSocket, session_id: str):
    await handle_interview_websocket(websocket, session_id)


# ── __init__ files ────────────────────────────────────────────────────────────
# (Python needs these for imports to work as packages)
