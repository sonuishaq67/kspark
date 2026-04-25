"""
Typed async query functions for all DB operations.
All functions accept an open aiosqlite.Connection.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

import aiosqlite

from db.init import get_db

DEMO_USER_ID = "demo-user-001"


# ── helpers ──────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    return str(uuid.uuid4())


def _row_to_dict(row: aiosqlite.Row) -> dict[str, Any]:
    return dict(row)


# ── sessions ─────────────────────────────────────────────────────────────────

async def create_session(
    mode: str = "professional",
    persona_id: str = "neutral",
    user_id: str = DEMO_USER_ID,
) -> dict[str, Any]:
    session_id = _new_id()
    async with await get_db() as db:
        await db.execute(
            """
            INSERT INTO sessions (id, user_id, mode, persona_id, state, started_at)
            VALUES (?, ?, ?, ?, 'PLANNING', ?)
            """,
            (session_id, user_id, mode, persona_id, _now()),
        )
        await db.commit()
    return {"session_id": session_id, "user_id": user_id, "mode": mode, "persona_id": persona_id}


async def get_session(session_id: str) -> dict[str, Any] | None:
    async with await get_db() as db:
        async with db.execute(
            "SELECT * FROM sessions WHERE id = ?", (session_id,)
        ) as cursor:
            row = await cursor.fetchone()
    return _row_to_dict(row) if row else None


async def update_session_state(
    session_id: str,
    state: str,
    current_question_idx: int | None = None,
    questions_completed: int | None = None,
) -> None:
    parts = ["state = ?"]
    values: list[Any] = [state]

    if current_question_idx is not None:
        parts.append("current_question_idx = ?")
        values.append(current_question_idx)

    if questions_completed is not None:
        parts.append("questions_completed = ?")
        values.append(questions_completed)

    values.append(session_id)

    async with await get_db() as db:
        await db.execute(
            f"UPDATE sessions SET {', '.join(parts)} WHERE id = ?",
            values,
        )
        await db.commit()


async def end_session(session_id: str, tldr: str, questions_completed: int) -> None:
    async with await get_db() as db:
        await db.execute(
            """
            UPDATE sessions
            SET state = 'ENDED', ended_at = ?, tldr = ?, questions_completed = ?
            WHERE id = ?
            """,
            (_now(), tldr, questions_completed, session_id),
        )
        await db.commit()


async def list_sessions(user_id: str = DEMO_USER_ID, limit: int = 20) -> list[dict[str, Any]]:
    async with await get_db() as db:
        async with db.execute(
            """
            SELECT id, user_id, mode, persona_id, state,
                   current_question_idx, questions_completed,
                   started_at, ended_at, tldr
            FROM sessions
            WHERE user_id = ?
            ORDER BY started_at DESC
            LIMIT ?
            """,
            (user_id, limit),
        ) as cursor:
            rows = await cursor.fetchall()
    return [_row_to_dict(r) for r in rows]


# ── turns ─────────────────────────────────────────────────────────────────────

async def append_turn(
    session_id: str,
    question_id: str,
    speaker: str,
    transcript: str,
    classification: str | None = None,
    gap_addressed: str | None = None,
    probe_count: int = 0,
) -> str:
    turn_id = _new_id()
    async with await get_db() as db:
        await db.execute(
            """
            INSERT INTO turns
              (id, session_id, question_id, speaker, transcript,
               classification, gap_addressed, probe_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                turn_id, session_id, question_id, speaker, transcript,
                classification, gap_addressed, probe_count, _now(),
            ),
        )
        await db.commit()
    return turn_id


async def get_turns_for_session(session_id: str) -> list[dict[str, Any]]:
    async with await get_db() as db:
        async with db.execute(
            """
            SELECT * FROM turns
            WHERE session_id = ?
            ORDER BY created_at ASC
            """,
            (session_id,),
        ) as cursor:
            rows = await cursor.fetchall()
    return [_row_to_dict(r) for r in rows]
