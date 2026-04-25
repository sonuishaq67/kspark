"""
Typed async query functions for the research_cache table.
Follows the same connection-management pattern as queries.py.
"""
from __future__ import annotations

import json
import uuid

from db.init import get_db


def _new_id() -> str:
    return str(uuid.uuid4())


async def get_cached_research(
    company: str, role: str, category: str, ttl_hours: int
) -> list[dict] | None:
    """
    Return deserialized results list if a non-stale entry exists, else None.
    Staleness is checked in SQL: created_at > datetime('now', '-{ttl_hours} hours').
    """
    db = await get_db()
    try:
        async with db.execute(
            """
            SELECT results_json
            FROM research_cache
            WHERE company = ?
              AND role = ?
              AND search_category = ?
              AND created_at > datetime('now', ? || ' hours')
            """,
            (company, role, category, f"-{ttl_hours}"),
        ) as cursor:
            row = await cursor.fetchone()
    finally:
        await db.close()

    if row is None:
        return None

    return json.loads(row[0])


async def upsert_research_cache(
    company: str, role: str, category: str, results_json: str
) -> None:
    """
    Insert or replace a cache entry. Uses INSERT OR REPLACE
    on the (company, role, search_category) unique constraint.
    """
    db = await get_db()
    try:
        await db.execute(
            """
            INSERT OR REPLACE INTO research_cache
                (id, company, role, search_category, results_json, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
            """,
            (_new_id(), company, role, category, results_json),
        )
        await db.commit()
    finally:
        await db.close()
