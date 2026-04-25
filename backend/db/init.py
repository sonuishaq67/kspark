"""
Run the schema.sql migration on app startup.
Creates tables and seeds the demo user if they don't exist.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path

import aiosqlite

logger = logging.getLogger(__name__)

SCHEMA_PATH = Path(__file__).parent / "schema.sql"
DEMO_USER_ID = "demo-user-001"


def _db_path() -> str:
    return os.getenv("SQLITE_PATH", "data/interview_coach.db")


async def init_db() -> None:
    """Create the database file, run schema.sql, seed demo user."""
    db_path = _db_path()

    # Ensure the parent directory exists
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    schema = SCHEMA_PATH.read_text()

    async with aiosqlite.connect(db_path) as db:
        await db.executescript(schema)
        await _ensure_role_ready_extensions(db)
        await db.commit()

    logger.info("Database initialised at %s", db_path)


async def get_db() -> aiosqlite.Connection:
    """Return an open connection as an async context manager."""
    db = await aiosqlite.connect(_db_path())
    db.row_factory = aiosqlite.Row
    return db


async def _ensure_role_ready_extensions(db: aiosqlite.Connection) -> None:
    """Additive migration for older local DB files that predate RoleReady columns."""
    async with db.execute("PRAGMA table_info(sessions)") as cursor:
        rows = await cursor.fetchall()

    existing = {row[1] for row in rows}
    missing_columns = [
        ("target_role", "TEXT"),
        ("company_name", "TEXT"),
        ("interview_type", "TEXT DEFAULT 'mixed'"),
        ("readiness_score", "INTEGER"),
        ("summary", "TEXT"),
    ]

    for column_name, column_type in missing_columns:
        if column_name not in existing:
            await db.execute(
                f"ALTER TABLE sessions ADD COLUMN {column_name} {column_type}"
            )
