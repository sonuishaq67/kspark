# Requirements Document

## Introduction

RoleReady AI currently makes live Tavily API calls every time `research_company()` is invoked, even when the same company + role combination has been researched before. This feature adds a database-backed cache layer for Tavily research results so that repeated lookups for the same company, role, and search category (question types or interviewer types) return cached data instead of making redundant API calls. This reduces latency, saves API quota, and enables offline access to previously fetched research.

## Glossary

- **Cache**: A SQLite table that stores previously fetched Tavily research results for reuse.
- **Research_Cache_Service**: The backend module responsible for reading from and writing to the cache, and deciding whether to call the Tavily API or return cached data.
- **Search_Category**: The type of Tavily search being performed — either `question_types` or `interviewer_types`.
- **Cache_Key**: The unique combination of company name, role, and search category that identifies a cached research result.
- **Cache_Entry**: A single row in the cache table representing the stored results for one cache key.
- **TTL**: Time-to-live — the maximum age of a cache entry before it is considered stale and must be refreshed.
- **Tavily_Client**: The existing Tavily API client that performs live web searches.
- **Results_JSON**: The JSON-serialized list of result dicts (title, url, content, score) returned by a Tavily search.

## Requirements

### Requirement 1: Cache Table Schema

**User Story:** As a developer, I want a dedicated database table for Tavily research results, so that cached data is stored persistently and can be queried by company, role, and search category.

#### Acceptance Criteria

1. THE Cache SHALL store each entry with a unique identifier, company name, role, search category, the serialized results JSON, and a creation timestamp.
2. THE Cache SHALL enforce a uniqueness constraint on the combination of company name, role, and search category so that only one entry exists per cache key.
3. THE Cache SHALL use the same SQLite database and connection patterns as the existing `sessions` and `turns` tables.
4. WHEN the application starts, THE Database_Initializer SHALL create the cache table if the table does not already exist.

### Requirement 2: Cache Lookup on Research Request

**User Story:** As a user, I want previously researched company data to load instantly from the cache, so that I do not wait for redundant API calls.

#### Acceptance Criteria

1. WHEN `research_company()` is called for a given company, role, and search category, THE Research_Cache_Service SHALL first query the cache for a matching entry.
2. WHEN a valid (non-stale) cache entry exists for the requested cache key, THE Research_Cache_Service SHALL return the cached results without calling the Tavily_Client.
3. WHEN no cache entry exists for the requested cache key, THE Research_Cache_Service SHALL call the Tavily_Client and return the live results.
4. THE Research_Cache_Service SHALL normalize company names to lowercase and trim whitespace before performing cache lookups so that "Google", "google", and " Google " resolve to the same cache key.

### Requirement 3: Cache Write After Live Fetch

**User Story:** As a developer, I want live Tavily results to be automatically stored in the cache after fetching, so that future requests for the same data are served from the cache.

#### Acceptance Criteria

1. WHEN the Tavily_Client returns results for a company, role, and search category that has no existing cache entry, THE Research_Cache_Service SHALL insert a new cache entry with the serialized results and the current timestamp.
2. WHEN the Tavily_Client returns results for a cache key that already has a stale entry, THE Research_Cache_Service SHALL replace the existing entry with the fresh results and update the timestamp.
3. IF the Tavily_Client returns an error or an empty result set, THEN THE Research_Cache_Service SHALL retain any existing cache entry for that cache key unchanged.

### Requirement 4: Cache Staleness and TTL

**User Story:** As a user, I want cached research data to be refreshed periodically, so that I receive reasonably up-to-date information about company interview practices.

#### Acceptance Criteria

1. THE Research_Cache_Service SHALL treat a cache entry as stale when the entry's creation timestamp is older than the configured TTL.
2. THE Research_Cache_Service SHALL use a default TTL of 7 days.
3. WHEN a stale cache entry is found, THE Research_Cache_Service SHALL call the Tavily_Client for fresh results and update the cache entry.
4. WHERE a `TAVILY_CACHE_TTL_HOURS` environment variable is set, THE Research_Cache_Service SHALL use that value (in hours) as the TTL instead of the default.

### Requirement 5: Cache Query Functions

**User Story:** As a developer, I want typed async query functions for the cache table, so that cache operations follow the same patterns as existing database queries in `queries.py`.

#### Acceptance Criteria

1. THE Cache_Query_Module SHALL provide an async function to look up a cache entry by company, role, and search category, returning the deserialized results list or `None` if no entry exists.
2. THE Cache_Query_Module SHALL provide an async function to insert or replace a cache entry for a given company, role, and search category.
3. THE Cache_Query_Module SHALL use parameterized queries for all database operations.
4. THE Cache_Query_Module SHALL follow the same connection management pattern (`async with await get_db() as db`) used by the existing query functions.

### Requirement 6: Backward Compatibility

**User Story:** As a developer, I want the caching layer to be transparent to existing callers of `research_company()`, so that no changes are required in the orchestrator or API layers.

#### Acceptance Criteria

1. THE Research_Cache_Service SHALL preserve the existing `research_company()` function signature (`company: str, role: str`) and return type (`CompanyResearchResult`).
2. THE Research_Cache_Service SHALL preserve the existing `search_company_question_types()` and `search_company_interviewer_types()` function signatures and return types.
3. WHEN the cache table does not exist or a database error occurs during cache operations, THE Research_Cache_Service SHALL fall back to calling the Tavily_Client directly and log a warning.
