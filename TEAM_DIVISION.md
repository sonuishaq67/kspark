# Team Division & Ownership

This document defines clear ownership boundaries to minimize merge conflicts and enable parallel development.

## Ownership Principle

Each person owns a **vertical slice** — their own service folders, web pages, config subtrees, and migrations. The only shared files are contracts (`proto/`) and shared Python models (`services/shared/`) which get locked down early in week 1.

---

## 👤 Person 1 — Platform, Infra & Data Layer

### Full Ownership
- `services/p1_platform/` (gateway, research, persona, reasoning)
- `web/app/(p1)/` (onboarding, dashboard, profile, settings)
- `web/components/p1/`
- `infra/` (docker-compose, migrations, terraform)
- `config/companies/`
- `prompts/p1_*.md`
- `.github/workflows/ci-p1.yml`

### Responsibilities
**Week 1 (Unblocks everyone):**
- Scaffold full monorepo structure
- `docker-compose.yml` with Postgres, Redis, Judge0
- All 6 DB migrations
- `services/shared/` — Pydantic models, DB pool, event bus stubs
- `web/components/shared/` — Button, Input, Layout, Nav
- `proto/` — seed all OpenAPI specs with agreed contracts

**Week 2–3:**
- JWT auth on gateway (`/auth/register`, `/auth/login`, `/auth/verify`)
- Resume upload + PDF/DOCX parsing + LLM extraction
- JD parsing + gap analysis endpoint
- Profile CRUD (`GET/PATCH /users/me/profile`)
- Tavily research agent with 30s budget + fallback
- Custom company profile persistence + 30-day staleness refresh

**Week 4–5:**
- Onboarding flow pages
- Research brief display on pre-session screen
- Diagnostic quiz generator
- Dashboard page (level bar, streak, recent sessions, sparklines)
- Profile + Settings pages
- CI pipeline for P1 services

---

## 👤 Person 2 — Interview Engine & Voice

### Full Ownership
- `services/p2_interview/` (orchestrator, speech, scaffolding)
- `web/app/(p2)/` (interview/[sessionId], report/[sessionId])
- `web/components/p2/`
- `config/personas/`, `config/modes/`, `config/formats/`, `config/rubrics.yaml`
- `prompts/p2_*.md`
- `infra/seed/question_bank/`
- `.github/workflows/ci-p2.yml`

### Responsibilities
**Week 1–2 (Parallel with P1):**
- All 8 prompt templates
- Persona + mode + format YAML configs
- `config/rubrics.yaml` with 8-metric definitions
- Seed 200+ interview questions with gap hints

**Week 3–4:**
- Deepgram ASR streaming integration
- VAD wrapper (silero-vad)
- ElevenLabs TTS streaming + barge-in
- Speech pipeline service (ASR + VAD → TurnSignals)
- librosa + parselmouth prosody analyzer
- Hume Voice client

**Week 5–6:**
- Orchestrator state machine
- Sub-agent spawn/lifecycle + context assembly
- Thread tracker
- Turn handler dispatch
- Streaming pre-decision loop + TTS pre-fetch
- Scaffolding classifier middleware + CI regression eval

**Week 7–8:**
- `/interview/[sessionId]` page
- Post-session feedback orchestration
- Voice summary synthesizer
- `/report/[sessionId]` page with radar chart
- Latency benchmarks
- Eval set of 50 labeled turn transcripts

---

## 👤 Person 3 — Learning, Coding & Progression

### Full Ownership
- `services/p3_learning/` (practice, learning, coding, progression)
- `web/app/(p3)/` (practice, learn/[sessionId], code/[sessionId], achievements)
- `web/components/p3/`
- `config/achievements.yaml`, `config/practice_drills.yaml`
- `prompts/p3_*.md`
- `infra/seed/leetcode/`
- `data/`
- `.github/workflows/ci-p3.yml`

### Responsibilities
**Week 1–2 (Parallel with P1):**
- `config/practice_drills.yaml` with 10+ drill types
- `config/achievements.yaml` with 20+ achievements
- LeetCode SQLite import script
- Practice service: single-drill loop
- Per-drill scoring breakdown templates

**Week 3–4:**
- LeetCode SQLite query layer
- Judge0 bridge (`POST /code/run`, `GET /code/questions`, `POST /code/submit`)
- Coding sub-agent context assembly + follow-up prompts
- Helpfulness levels (silent / hints / guided / full-walkthrough)
- Guided learning engine: topic selector
- Learning session API

**Week 5–6:**
- XP calculator
- Level threshold function + cumulative XP resolver
- `session.completed` event handler
- Feature unlock population + feature gate middleware
- Streak service (timezone-aware, weekly freeze)
- Achievement rule evaluator
- Difficulty manager

**Week 7–8:**
- `/practice` page
- `/learn/[sessionId]` page
- `/code/[sessionId]` page with CodeMirror 6
- `/achievements` page
- Full-loop session orchestration
- Stress mode
- Progression security tests

---

## 🔒 Shared Resources (Require Coordination)

### `proto/` — OpenAPI Contracts
**Owner:** Each person authors their own service's spec
**Rule:** Finalize in Day 1 kickoff meeting, then read-only unless all agree

### `services/shared/` — Shared Python Code
**Owner:** P1 writes base models in week 1
**Rule:** After week 1, changes require PR review from all 3

### `web/components/shared/` — Design System
**Owner:** P1 seeds in week 1 (Button, Input, Layout, Nav)
**Rule:** Additions require quick group check to avoid duplication

### `infra/migrations/` — Database Migrations
**Owner:** P1 is sole migration author
**Rule:** P2/P3 file requests in `infra/migrations/requests/`, P1 merges into numbered sequence

---

## Sync Points (Coordination Required)

| When | What | Who |
|---|---|---|
| Day 1 | Agree on all OpenAPI contracts in `proto/` | All 3 |
| Day 1 | Agree on shared Pydantic models in `services/shared/` | All 3 |
| End of week 1 | P1 delivers: DB up, shared models, design system stubs | P2 + P3 unblocked |
| Week 3 | P2 delivers: `TurnSignals` event schema | P3 can wire progression to it |
| Week 5 | P3 delivers: `session.completed` event | P2 can emit it from orchestrator |
| Week 7 | Integration pass: P2 orchestrator calls P3 progression | All 3 |

---

## Conflict Avoidance Rules

1. **Never edit files outside your ownership** without explicit coordination
2. **Migrations:** Only P1 touches `.sql` files. Others file requests.
3. **Shared models:** After week 1, changes go through PR with all 3 reviewers
4. **Proto contracts:** Agreed on Day 1, changes require all 3 to approve
5. **Web routes:** Each person owns their route group, no overlap
6. **Config files:** Each person owns specific config subtrees
7. **Prompts:** Each prompt file has exactly one owner (indicated by prefix)

---

## Communication Channels

- **Daily standup:** 15 min sync on blockers and handoffs
- **Slack/Discord:** `#p1-platform`, `#p2-interview`, `#p3-learning` for focused work
- **Shared channel:** `#integration` for cross-team coordination
- **PR reviews:** Tag relevant person for their owned files only

---

## Getting Started

1. **Day 1 Morning:** All 3 meet to agree on `proto/` contracts and `services/shared/` models
2. **Day 1 Afternoon:** P1 starts infra setup, P2/P3 start config authoring
3. **End of Week 1:** P1 delivers foundation, P2/P3 start service implementation
4. **Weekly:** Friday integration check-in to verify contracts still align
