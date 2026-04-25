"""
Typed async query functions for all DB operations.
All functions accept an open aiosqlite.Connection.
"""
from __future__ import annotations

import json
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


def _json_dump(value: Any) -> str:
    return json.dumps(value, ensure_ascii=True)


def _json_load(value: str | None, fallback: Any) -> Any:
    if not value:
        return fallback
    return json.loads(value)


# ── sessions ─────────────────────────────────────────────────────────────────

async def create_session(
    mode: str = "professional",
    persona_id: str = "neutral",
    user_id: str = DEMO_USER_ID,
    session_id: str | None = None,
    target_role: str | None = None,
    company_name: str | None = None,
    interview_type: str = "mixed",
    readiness_score: int | None = None,
    summary: str | None = None,
) -> dict[str, Any]:
    if session_id is None:
        session_id = _new_id()
    db = await get_db()
    try:
        await db.execute(
            """
            INSERT INTO sessions (
                id, user_id, mode, persona_id, state, started_at,
                target_role, company_name, interview_type, readiness_score, summary
            )
            VALUES (?, ?, ?, ?, 'PLANNING', ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id, user_id, mode, persona_id, _now(),
                target_role, company_name, interview_type, readiness_score, summary,
            ),
        )
        await db.commit()
    finally:
        await db.close()
    return {
        "session_id": session_id,
        "user_id": user_id,
        "mode": mode,
        "persona_id": persona_id,
        "target_role": target_role,
        "company_name": company_name,
        "interview_type": interview_type,
        "readiness_score": readiness_score,
        "summary": summary,
    }


async def get_session(session_id: str) -> dict[str, Any] | None:
    db = await get_db()
    try:
        async with db.execute(
            "SELECT * FROM sessions WHERE id = ?", (session_id,)
        ) as cursor:
            row = await cursor.fetchone()
    finally:
        await db.close()
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

    db = await get_db()
    try:
        await db.execute(
            f"UPDATE sessions SET {', '.join(parts)} WHERE id = ?",
            values,
        )
        await db.commit()
    finally:
        await db.close()


async def end_session(session_id: str, tldr: str, questions_completed: int) -> None:
    db = await get_db()
    try:
        await db.execute(
            """
            UPDATE sessions
            SET state = 'ENDED', ended_at = ?, tldr = ?, questions_completed = ?
            WHERE id = ?
            """,
            (_now(), tldr, questions_completed, session_id),
        )
        await db.commit()
    finally:
        await db.close()


async def list_sessions(user_id: str = DEMO_USER_ID, limit: int = 20) -> list[dict[str, Any]]:
    db = await get_db()
    try:
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
    finally:
        await db.close()
    return [_row_to_dict(r) for r in rows]


async def get_sessions_list(
    user_id: str = DEMO_USER_ID,
    limit: int = 20,
) -> list[dict[str, Any]]:
    db = await get_db()
    try:
        async with db.execute(
            """
            SELECT
                s.id,
                s.user_id,
                s.mode,
                s.persona_id,
                s.state,
                s.current_question_idx,
                s.questions_completed,
                s.started_at,
                s.ended_at,
                s.tldr,
                s.target_role,
                s.readiness_score,
                COALESCE(s.tldr, r.summary, '') AS summary_preview,
                (
                    SELECT g.label
                    FROM gaps g
                    WHERE g.session_id = s.id
                      AND g.status = 'open'
                    ORDER BY g.created_at ASC
                    LIMIT 1
                ) AS main_gap
            FROM sessions s
            LEFT JOIN reports r ON r.session_id = s.id
            WHERE s.user_id = ?
            ORDER BY s.started_at DESC
            LIMIT ?
            """,
            (user_id, limit),
        ) as cursor:
            rows = await cursor.fetchall()
    finally:
        await db.close()
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
    db = await get_db()
    try:
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
    finally:
        await db.close()
    return turn_id


async def get_turns_for_session(session_id: str) -> list[dict[str, Any]]:
    db = await get_db()
    try:
        async with db.execute(
            """
            SELECT * FROM turns
            WHERE session_id = ?
            ORDER BY created_at ASC
            """,
            (session_id,),
        ) as cursor:
            rows = await cursor.fetchall()
    finally:
        await db.close()
    return [_row_to_dict(r) for r in rows]


async def insert_report(
    session_id: str,
    summary: str,
    strengths: list[str],
    gaps: list[dict],
    scores: dict,
    follow_up_analysis: list[dict],
    next_practice_plan: list[str],
) -> str:
    """Insert report and return report_id."""
    report_id = _new_id()
    db = await get_db()
    try:
        await db.execute(
            """
            INSERT INTO reports (
                id,
                session_id,
                summary,
                strengths_json,
                gaps_json,
                scores_json,
                followup_json,
                next_steps_json,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                report_id,
                session_id,
                summary,
                _json_dump(strengths),
                _json_dump(gaps),
                _json_dump(scores),
                _json_dump(follow_up_analysis),
                _json_dump(next_practice_plan),
                _now(),
            ),
        )
        await db.commit()
    finally:
        await db.close()
    return report_id


async def get_report(session_id: str) -> dict[str, Any] | None:
    """Return stored report plus session metadata, or None if not generated."""
    db = await get_db()
    try:
        async with db.execute(
            """
            SELECT
                r.id AS report_id,
                r.session_id,
                r.summary,
                r.strengths_json,
                r.gaps_json,
                r.scores_json,
                r.followup_json,
                r.next_steps_json,
                r.created_at,
                s.target_role,
                s.readiness_score,
                s.started_at,
                s.ended_at
            FROM reports r
            JOIN sessions s ON s.id = r.session_id
            WHERE r.session_id = ?
            LIMIT 1
            """,
            (session_id,),
        ) as cursor:
            row = await cursor.fetchone()
    finally:
        await db.close()

    if not row:
        return None

    data = _row_to_dict(row)
    return {
        "report_id": data["report_id"],
        "session_id": data["session_id"],
        "summary": data["summary"],
        "strengths": _json_load(data.get("strengths_json"), []),
        "gaps": _json_load(data.get("gaps_json"), []),
        "scores": _json_load(data.get("scores_json"), {}),
        "follow_up_analysis": _json_load(data.get("followup_json"), []),
        "next_practice_plan": _json_load(data.get("next_steps_json"), []),
        "created_at": data["created_at"],
        "target_role": data.get("target_role"),
        "readiness_score": data.get("readiness_score"),
        "started_at": data["started_at"],
        "ended_at": data.get("ended_at"),
    }


async def mark_session_ended(session_id: str) -> None:
    db = await get_db()
    try:
        await db.execute(
            """
            UPDATE sessions
            SET state = 'ENDED', ended_at = COALESCE(ended_at, ?)
            WHERE id = ?
            """,
            (_now(), session_id),
        )
        await db.commit()
    finally:
        await db.close()


# ── gaps ──────────────────────────────────────────────────────────────────────

async def insert_gap(
    session_id: str,
    label: str,
    category: str,
    evidence: str | None = None,
    status: str = "open",
) -> str:
    """Insert a gap and return gap_id."""
    gap_id = _new_id()
    db = await get_db()
    try:
        await db.execute(
            """
            INSERT INTO gaps (id, session_id, label, category, evidence, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (gap_id, session_id, label, category, evidence, status, _now()),
        )
        await db.commit()
    finally:
        await db.close()
    return gap_id


async def get_gaps_for_session(session_id: str) -> list[dict[str, Any]]:
    """Get all gaps for a session."""
    db = await get_db()
    try:
        async with db.execute(
            """
            SELECT * FROM gaps
            WHERE session_id = ?
            ORDER BY created_at ASC
            """,
            (session_id,),
        ) as cursor:
            rows = await cursor.fetchall()
    finally:
        await db.close()
    return [_row_to_dict(r) for r in rows]


async def update_gap_status(
    gap_id: str,
    status: str,
    evidence: str | None = None,
) -> None:
    """Update gap status (open → improved → closed)."""
    db = await get_db()
    try:
        if evidence:
            await db.execute(
                """
                UPDATE gaps
                SET status = ?, evidence = ?
                WHERE id = ?
                """,
                (status, evidence, gap_id),
            )
        else:
            await db.execute(
                """
                UPDATE gaps
                SET status = ?
                WHERE id = ?
                """,
                (status, gap_id),
            )
        await db.commit()
    finally:
        await db.close()


async def get_gap_by_label(session_id: str, label: str) -> dict[str, Any] | None:
    """Get a specific gap by label."""
    db = await get_db()
    try:
        async with db.execute(
            """
            SELECT * FROM gaps
            WHERE session_id = ? AND label = ?
            LIMIT 1
            """,
            (session_id, label),
        ) as cursor:
            row = await cursor.fetchone()
    finally:
        await db.close()
    return _row_to_dict(row) if row else None
