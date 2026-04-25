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
    target_role          TEXT,
    company_name         TEXT,
    interview_type       TEXT DEFAULT 'mixed',
    readiness_score      INTEGER,
    summary              TEXT,
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
