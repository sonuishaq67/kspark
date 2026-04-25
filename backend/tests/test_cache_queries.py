"""
Unit tests for backend/db/cache_queries.py — verifies get_cached_research
and upsert_research_cache against an in-memory SQLite database.
"""
from __future__ import annotations

import json
from unittest.mock import patch

import aiosqlite
import pytest

from db.cache_queries import get_cached_research, upsert_research_cache

SCHEMA = """
CREATE TABLE IF NOT EXISTS research_cache (
    id               TEXT PRIMARY KEY,
    company          TEXT NOT NULL,
    role             TEXT NOT NULL,
    search_category  TEXT NOT NULL CHECK (search_category IN ('question_types', 'interviewer_types')),
    results_json     TEXT NOT NULL,
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (company, role, search_category)
);
"""

SAMPLE_RESULTS = [
    {"title": "Top Questions", "url": "https://example.com/q", "content": "behavioral questions", "score": 0.9},
    {"title": "Interview Tips", "url": "https://example.com/t", "content": "system design tips", "score": 0.8},
]

# Use a URI-based shared in-memory database so multiple connections see the same data.
TEST_DB_URI = "file:test_cache_db?mode=memory&cache=shared"


@pytest.fixture
async def patch_get_db():
    """
    Fixture that patches get_db to return fresh started connections to a
    shared in-memory SQLite database.
    """
    # Bootstrap: create the schema via an initial connection that stays open
    # for the lifetime of the fixture (keeps the shared memory DB alive).
    anchor = await aiosqlite.connect(TEST_DB_URI, uri=True)
    await anchor.executescript(SCHEMA)
    await anchor.commit()

    async def _fake_get_db():
        """Return a fresh, started Connection pointing at the shared DB."""
        conn = await aiosqlite.connect(TEST_DB_URI, uri=True)
        conn.row_factory = aiosqlite.Row
        return conn

    with patch("db.cache_queries.get_db", side_effect=_fake_get_db):
        yield anchor

    # Clean up: delete all rows so tests are isolated
    await anchor.execute("DELETE FROM research_cache")
    await anchor.commit()
    await anchor.close()


# ── get_cached_research ──────────────────────────────────────────────────────


async def test_get_cached_research_returns_none_on_empty_table(patch_get_db):
    """Cache miss returns None when no entries exist."""
    result = await get_cached_research("google", "software engineer", "question_types", 168)
    assert result is None


async def test_get_cached_research_returns_data_for_fresh_entry(patch_get_db):
    """A recently inserted entry is returned when within TTL."""
    await upsert_research_cache("google", "software engineer", "question_types", json.dumps(SAMPLE_RESULTS))
    result = await get_cached_research("google", "software engineer", "question_types", 168)
    assert result == SAMPLE_RESULTS


async def test_get_cached_research_returns_none_for_wrong_key(patch_get_db):
    """Lookup with a different company/role/category returns None."""
    await upsert_research_cache("google", "software engineer", "question_types", json.dumps(SAMPLE_RESULTS))

    # Different company
    assert await get_cached_research("meta", "software engineer", "question_types", 168) is None
    # Different role
    assert await get_cached_research("google", "data scientist", "question_types", 168) is None
    # Different category
    assert await get_cached_research("google", "software engineer", "interviewer_types", 168) is None


async def test_get_cached_research_returns_none_for_stale_entry(patch_get_db):
    """An entry with TTL=0 hours is immediately stale and returns None."""
    await upsert_research_cache("google", "software engineer", "question_types", json.dumps(SAMPLE_RESULTS))
    # TTL of 0 means the entry must be newer than now, which it can't be
    result = await get_cached_research("google", "software engineer", "question_types", 0)
    assert result is None


# ── upsert_research_cache ───────────────────────────────────────────────────


async def test_upsert_creates_new_entry(patch_get_db):
    """Upserting into an empty table creates one row."""
    await upsert_research_cache("acme", "software engineer", "question_types", json.dumps(SAMPLE_RESULTS))

    anchor = patch_get_db
    async with anchor.execute("SELECT COUNT(*) FROM research_cache WHERE company='acme'") as cursor:
        row = await cursor.fetchone()
    assert row[0] == 1


async def test_upsert_replaces_existing_entry(patch_get_db):
    """Upserting the same key twice results in one row with the latest data."""
    first_results = [{"title": "Old", "url": "https://old.com", "content": "old", "score": 0.5}]
    second_results = [{"title": "New", "url": "https://new.com", "content": "new", "score": 0.95}]

    await upsert_research_cache("replace-co", "swe", "question_types", json.dumps(first_results))
    await upsert_research_cache("replace-co", "swe", "question_types", json.dumps(second_results))

    anchor = patch_get_db
    async with anchor.execute(
        "SELECT COUNT(*) FROM research_cache WHERE company='replace-co' AND role='swe' AND search_category='question_types'"
    ) as cursor:
        row = await cursor.fetchone()
    assert row[0] == 1

    result = await get_cached_research("replace-co", "swe", "question_types", 168)
    assert result == second_results


async def test_upsert_generates_uuid_id(patch_get_db):
    """Each upserted row has a valid UUID as its id."""
    import uuid

    await upsert_research_cache("uuid-co", "swe", "question_types", json.dumps(SAMPLE_RESULTS))

    anchor = patch_get_db
    async with anchor.execute("SELECT id FROM research_cache WHERE company='uuid-co'") as cursor:
        row = await cursor.fetchone()

    # Should not raise — valid UUID
    uuid.UUID(row[0])


async def test_upsert_uses_parameterized_queries(patch_get_db):
    """Verify that SQL injection attempts are safely handled via parameterization."""
    malicious_company = "'; DROP TABLE research_cache; --"
    await upsert_research_cache(malicious_company, "swe", "question_types", json.dumps(SAMPLE_RESULTS))

    result = await get_cached_research(malicious_company, "swe", "question_types", 168)
    assert result == SAMPLE_RESULTS
