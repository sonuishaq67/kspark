# Implementation Plan: Tavily Research Cache

## Overview

Add a database-backed cache layer for Tavily research results using the existing SQLite database and aiosqlite patterns. The implementation proceeds bottom-up: schema first, then query functions, then service-layer integration, then tests. Each step builds on the previous one, and nothing is left unwired.

## Tasks

- [x] 1. Add the `research_cache` table to the database schema
  - [x] 1.1 Append the `research_cache` CREATE TABLE statement to `backend/db/schema.sql`
    - Add `CREATE TABLE IF NOT EXISTS research_cache` with columns: `id` (TEXT PRIMARY KEY), `company` (TEXT NOT NULL), `role` (TEXT NOT NULL), `search_category` (TEXT NOT NULL, CHECK IN ('question_types', 'interviewer_types')), `results_json` (TEXT NOT NULL), `created_at` (TEXT NOT NULL DEFAULT datetime('now'))
    - Add `UNIQUE (company, role, search_category)` constraint
    - No changes needed to `backend/db/init.py` — it already runs the full `schema.sql` via `executescript`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement cache query functions
  - [x] 2.1 Create `backend/db/cache_queries.py` with `get_cached_research` and `upsert_research_cache`
    - Import `get_db` from `db.init` and follow the same `async with await get_db() as db` pattern used in `queries.py`
    - Implement `async def get_cached_research(company: str, role: str, category: str, ttl_hours: int) -> list[dict] | None` — SELECT with TTL check via `created_at > datetime('now', '-{ttl_hours} hours')`, return deserialized JSON list or `None`
    - Implement `async def upsert_research_cache(company: str, role: str, category: str, results_json: str) -> None` — use `INSERT OR REPLACE` on the unique constraint, generate a UUID for the `id` column
    - Use parameterized queries for all SQL operations
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 2.2 Write property test: Cache round-trip preserves data
    - **Property 1: Cache round-trip preserves data**
    - **Validates: Requirements 5.1, 5.2**
    - Use Hypothesis to generate random lists of result dicts (title, url, content, score), upsert them, then look them up and assert equality
    - Test file: `backend/tests/test_cache.py`

  - [ ]* 2.3 Write property test: Upsert idempotence — one row per cache key
    - **Property 2: Upsert idempotence — one row per cache key**
    - **Validates: Requirements 1.2, 3.2**
    - Use Hypothesis to generate two distinct payloads for the same (company, role, category) key, upsert both, assert exactly one row exists and it contains the second payload

  - [ ]* 2.4 Write property test: Company name normalization
    - **Property 3: Company name normalization**
    - **Validates: Requirements 2.4**
    - Use Hypothesis to generate random strings, verify that `_normalize_company(s)` equals `_normalize_company(s.upper())`, `_normalize_company(s.lower())`, `_normalize_company("  " + s + "  ")`, and `_normalize_company("\t" + s + "\n")`

- [x] 3. Integrate cache into the research service layer
  - [x] 3.1 Add helper functions to `backend/llm/tavilyresearch.py`
    - Add `_normalize_company(name: str) -> str` that returns `name.strip().lower()`
    - Add `_get_ttl_hours() -> int` that reads `TAVILY_CACHE_TTL_HOURS` from env, defaults to `168` (7 days), logs a warning and falls back to default on invalid values
    - _Requirements: 2.4, 4.2, 4.4_

  - [x] 3.2 Convert `search_company_question_types` to async with cache integration
    - Convert the function to `async def` while preserving the existing signature `(company: str, role: str = "software engineer") -> list[dict]`
    - Add cache lookup before Tavily call: normalize company, call `get_cached_research`, return cached results if non-stale hit
    - On cache miss or stale entry, call Tavily client for live results
    - On successful live fetch (non-empty results), call `upsert_research_cache` to store/update the cache
    - Wrap all cache operations in `try/except Exception` with `logger.warning` fallback
    - If Tavily errors and stale cached data exists, return the stale data
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.3, 6.2, 6.3_

  - [x] 3.3 Convert `search_company_interviewer_types` to async with cache integration
    - Apply the same async + cache pattern as `search_company_question_types` for the `interviewer_types` category
    - Preserve existing signature `(company: str, role: str = "software engineer") -> list[dict]`
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.3, 6.2, 6.3_

  - [x] 3.4 Convert `research_company` to async and wire up cached search functions
    - Convert to `async def` while preserving signature `(company: str, role: str = "software engineer") -> CompanyResearchResult`
    - Await the now-async `search_company_question_types` and `search_company_interviewer_types` calls
    - _Requirements: 6.1_

- [x] 4. Checkpoint — Verify schema and integration
  - Ensure all tests pass, ask the user if questions arise.
  - Verify `init_db()` creates the `research_cache` table in a fresh database
  - Verify the existing `print_research` and CLI entry point still work (no signature changes to public API)

- [x] 5. Add `hypothesis` dependency and write remaining property tests
  - [x] 5.1 Add `hypothesis==6.100.0` to `backend/requirements.txt`
    - _Requirements: N/A (test infrastructure)_

  - [ ]* 5.2 Write property test: Non-stale cache hit avoids API call
    - **Property 4: Non-stale cache hit avoids API call**
    - **Validates: Requirements 2.1, 2.2, 3.1**
    - Use Hypothesis to generate valid (company, role) pairs and non-empty results, pre-populate cache with a recent timestamp, call the research function with a mocked Tavily client, assert Tavily client was NOT called and cached results were returned

  - [ ]* 5.3 Write property test: Staleness boundary correctness
    - **Property 5: Staleness boundary correctness**
    - **Validates: Requirements 4.1**
    - Use Hypothesis to generate random TTL values and cache entries with timestamps near the boundary, verify entries are treated as stale if and only if `created_at < now - ttl_hours`

  - [ ]* 5.4 Write property test: Stale entry triggers refresh and cache update
    - **Property 6: Stale entry triggers refresh and cache update**
    - **Validates: Requirements 3.2, 4.3**
    - Use Hypothesis to generate stale cache entries and new Tavily results, call the research function, assert Tavily was called, cache was updated with new results and fresh timestamp, and new results were returned

  - [ ]* 5.5 Write property test: Tavily error preserves existing cache entry
    - **Property 7: Tavily error preserves existing cache entry**
    - **Validates: Requirements 3.3**
    - Use Hypothesis to generate existing cache entries, simulate Tavily client raising an exception or returning empty results, assert the cache entry remains unchanged

- [x] 6. Write unit tests for helpers and edge cases
  - [ ]* 6.1 Write unit tests for `_get_ttl_hours` helper
    - Test default TTL (168) when env var is unset
    - Test custom TTL when `TAVILY_CACHE_TTL_HOURS` is set to a valid integer
    - Test fallback to 168 when env var is non-integer or negative
    - Use `monkeypatch` for env var management
    - Test file: `backend/tests/test_cache.py`
    - _Requirements: 4.2, 4.4_

  - [ ]* 6.2 Write unit tests for cache miss, DB error fallback, and function signatures
    - Test that a cache miss triggers a Tavily API call (mock Tavily client)
    - Test that when `get_db()` raises, research functions still return Tavily results and log a warning
    - Test that `research_company`, `search_company_question_types`, and `search_company_interviewer_types` accept the same args and return the same types as before
    - Test that `init_db()` creates the `research_cache` table in an in-memory database
    - Use in-memory SQLite (`:memory:`) via a fixture that patches `get_db()`
    - _Requirements: 2.3, 6.1, 6.2, 6.3_

- [-] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify backward compatibility: `research_company()` signature and return type unchanged
  - Verify cache operations are transparent to callers

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the 7 universal correctness properties defined in the design document
- Unit tests validate specific examples and edge cases
- All tests use in-memory SQLite and mocked Tavily client — no real API calls or persistent state
- The existing codebase uses Python with pytest and pytest-asyncio; all tests follow that pattern
