-- 001_demo_minimal.sql
-- Milestone 0 (hackathon demo cut) — minimal schema.
-- Restored to the full 6-migration set after submission per design ADR-016.
-- Tables: users, sessions, turns. No progression, no candidate model, no question bank.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    display_name  TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hardcoded demo user so /interview can start without an auth flow during M0.
INSERT INTO users (id, email, display_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@interview-coach.local', 'Demo Candidate')
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode                TEXT NOT NULL DEFAULT 'professional',
    persona_id          TEXT NOT NULL DEFAULT 'neutral',
    company_profile_id  TEXT NOT NULL DEFAULT 'generic-faang',
    state               TEXT NOT NULL DEFAULT 'PLANNING',
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at            TIMESTAMPTZ,
    tldr                TEXT
);

CREATE INDEX IF NOT EXISTS sessions_user_started_idx
    ON sessions (user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS turns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    question_id     TEXT NOT NULL,
    speaker         TEXT NOT NULL CHECK (speaker IN ('candidate', 'agent')),
    transcript      TEXT NOT NULL,
    classification  TEXT,            -- complete | partial | clarify | stall | refusal | null (agent turns)
    gap_addressed   TEXT,            -- which gap_hint this turn addressed, if any
    probe_count     INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS turns_session_created_idx
    ON turns (session_id, created_at);
