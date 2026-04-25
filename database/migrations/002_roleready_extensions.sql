-- 002_roleready_extensions.sql
-- Additive RoleReady schema extensions for sessions, gaps, and reports.

CREATE TABLE IF NOT EXISTS gaps (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    category    TEXT NOT NULL CHECK (category IN ('strong', 'partial', 'missing')),
    evidence    TEXT,
    status      TEXT NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open', 'improved', 'closed')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS gaps_session
    ON gaps (session_id);

CREATE TABLE IF NOT EXISTS reports (
    id              TEXT PRIMARY KEY,
    session_id      TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    summary         TEXT NOT NULL,
    strengths_json  TEXT NOT NULL,
    gaps_json       TEXT NOT NULL,
    scores_json     TEXT NOT NULL,
    followup_json   TEXT NOT NULL,
    next_steps_json TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS reports_session
    ON reports (session_id);
