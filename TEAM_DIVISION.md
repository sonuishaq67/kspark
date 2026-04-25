# Team Division & Ownership

This document defines clear ownership boundaries to minimize merge conflicts and enable parallel development within a **5-hour sprint**.

## Ownership Principle

Each person owns a **vertical slice** — their own service folders, web pages, config subtrees, and migrations. The only shared files are contracts (`proto/`) and shared Python models (`services/shared/`) which get locked down in the first 30 minutes.

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
**Hour 1 (0:00–1:00) — Foundation (Unblocks everyone):**
- Scaffold full monorepo structure
- `docker-compose.yml` with Postgres, Redis, Judge0
- All 6 DB migrations
- `services/shared/` — Pydantic models, DB pool, event bus stubs
- `web/components/shared/` — Button, Input, Layout, Nav
- `proto/` — seed all OpenAPI specs with agreed contracts

**Hour 2–3 (1:00–3:00) — Core Services:**
- JWT auth on gateway (`/auth/register`, `/auth/login`, `/auth/verify`)
- Resume upload + PDF/DOCX parsing + LLM extraction
- JD parsing + gap analysis endpoint
- Profile CRUD (`GET/PATCH /users/me/profile`)
- Tavily research agent with 30s budget + fallback
- Custom company profile persistence + 30-day staleness refresh

**Hour 4–5 (3:00–5:00) — UI & Polish:**
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
**Hour 1 (0:00–1:00) — Config & Prompts (Parallel with P1):**
- All 8 prompt templates
- Persona + mode + format YAML configs
- `config/rubrics.yaml` with 8-metric definitions
- Seed 200+ interview questions with gap hints

**Hour 2–3 (1:00–3:00) — Speech & Audio Pipeline:**
- Deepgram ASR streaming integration
- VAD wrapper (silero-vad)
- ElevenLabs TTS streaming + barge-in
- Speech pipeline service (ASR + VAD → TurnSignals)
- librosa + parselmouth prosody analyzer
- Hume Voice client

**Hour 4–5 (3:00–5:00) — Orchestrator & UI:**
- Orchestrator state machine
- Sub-agent spawn/lifecycle + context assembly
- Thread tracker + turn handler dispatch
- Streaming pre-decision loop + TTS pre-fetch
- Scaffolding classifier middleware
- `/interview/[sessionId]` page
- Post-session feedback orchestration
- Voice summary synthesizer
- `/report/[sessionId]` page with radar chart

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
**Hour 1 (0:00–1:00) — Config & Data (Parallel with P1):**
- `config/practice_drills.yaml` with 10+ drill types
- `config/achievements.yaml` with 20+ achievements
- LeetCode SQLite import script
- Practice service: single-drill loop
- Per-drill scoring breakdown templates

**Hour 2–3 (1:00–3:00) — Services & Logic:**
- LeetCode SQLite query layer
- Judge0 bridge (`POST /code/run`, `GET /code/questions`, `POST /code/submit`)
- Coding sub-agent context assembly + follow-up prompts
- Helpfulness levels (silent / hints / guided / full-walkthrough)
- Guided learning engine: topic selector
- Learning session API
- XP calculator + level threshold function + cumulative XP resolver

**Hour 4–5 (3:00–5:00) — Progression, UI & Integration:**
- `session.completed` event handler
- Feature unlock population + feature gate middleware
- Streak service (timezone-aware, weekly freeze)
- Achievement rule evaluator + difficulty manager
- `/practice` page
- `/learn/[sessionId]` page
- `/code/[sessionId]` page with CodeMirror 6
- `/achievements` page

---

## 🔒 Shared Resources (Require Coordination)

### `proto/` — OpenAPI Contracts
**Owner:** Each person authors their own service's spec
**Rule:** Finalize in the first 15 minutes, then read-only unless all agree

### `services/shared/` — Shared Python Code
**Owner:** P1 writes base models in Hour 1
**Rule:** After Hour 1, changes require quick verbal check from all 3

### `web/components/shared/` — Design System
**Owner:** P1 seeds in Hour 1 (Button, Input, Layout, Nav)
**Rule:** Additions require quick group check to avoid duplication

### `infra/migrations/` — Database Migrations
**Owner:** P1 is sole migration author
**Rule:** P2/P3 file requests in `infra/migrations/requests/`, P1 merges into numbered sequence

---

## Sync Points (Coordination Required)

| When | What | Who |
|---|---|---|
| 0:00 (Kickoff) | Agree on all OpenAPI contracts in `proto/` | All 3 |
| 0:00 (Kickoff) | Agree on shared Pydantic models in `services/shared/` | All 3 |
| 1:00 (End of Hour 1) | P1 delivers: DB up, shared models, design system stubs | P2 + P3 unblocked |
| 2:00 | P2 delivers: `TurnSignals` event schema | P3 can wire progression to it |
| 3:00 | P3 delivers: `session.completed` event | P2 can emit it from orchestrator |
| 4:00 | Integration pass: P2 orchestrator calls P3 progression | All 3 |
| 4:45 | Final integration check + smoke test | All 3 |

---

## Conflict Avoidance Rules

1. **Never edit files outside your ownership** without explicit coordination
2. **Migrations:** Only P1 touches `.sql` files. Others file requests.
3. **Shared models:** After Hour 1, changes go through quick verbal approval from all 3
4. **Proto contracts:** Agreed at kickoff, changes require all 3 to approve
5. **Web routes:** Each person owns their route group, no overlap
6. **Config files:** Each person owns specific config subtrees
7. **Prompts:** Each prompt file has exactly one owner (indicated by prefix)

---

## Communication Channels

- **Kickoff (0:00):** 15 min alignment on contracts and shared models
- **Hourly check-in:** 2 min standup at each hour mark for blockers
- **Live channel:** Shared voice/video call running throughout the sprint
- **Integration slot (4:00–4:45):** All 3 focus on wiring services together

---

## Getting Started

1. **0:00–0:15:** All 3 meet to agree on `proto/` contracts and `services/shared/` models
2. **0:15–1:00:** P1 starts infra setup, P2/P3 start config authoring
3. **1:00:** P1 delivers foundation, P2/P3 start service implementation
4. **4:00:** Integration pass — verify contracts align and services connect
5. **4:45–5:00:** Final smoke test and wrap-up
