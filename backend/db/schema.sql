-- Interview Coach — SQLite schema (hackathon cut)
-- Run on app startup via db/init.py

CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    email        TEXT UNIQUE NOT NULL,
    display_name TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Hardcoded demo user — no auth flow needed for the demo
INSERT OR IGNORE INTO users (id, email, display_name)
VALUES ('demo-user-001', 'demo@interview-coach.local', 'Demo Candidate');

CREATE TABLE IF NOT EXISTS sessions (
    id                   TEXT PRIMARY KEY,
    user_id              TEXT NOT NULL REFERENCES users(id),
    mode                 TEXT NOT NULL DEFAULT 'professional',
    persona_id           TEXT NOT NULL DEFAULT 'neutral',
    state                TEXT NOT NULL DEFAULT 'PLANNING',
    current_question_idx INTEGER NOT NULL DEFAULT 0,
    questions_completed  INTEGER NOT NULL DEFAULT 0,
    started_at           TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at             TEXT,
    tldr                 TEXT
);

CREATE INDEX IF NOT EXISTS sessions_user_started
    ON sessions (user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS turns (
    id              TEXT PRIMARY KEY,
    session_id      TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    question_id     TEXT NOT NULL,
    speaker         TEXT NOT NULL CHECK (speaker IN ('candidate', 'agent')),
    transcript      TEXT NOT NULL,
    classification  TEXT,   -- complete | partial | clarify | stall | refusal | null
    gap_addressed   TEXT,
    probe_count     INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS turns_session_created
    ON turns (session_id, created_at);
