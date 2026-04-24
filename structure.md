# Interview Coach — Folder Structure & Ownership

## Design Principle

The monorepo is organized for **3-person parallel development with minimal merge conflicts**. Each person owns a vertical slice: their service folders, web pages, config files, and prompts. The only shared code is locked down in week 1.

---

## Folder Structure

```
interview-coach/
│
├── proto/                          # 🔒 SHARED — finalize in week 1, then read-only
│   ├── openapi/
│   │   ├── auth.yaml               # P1 authors
│   │   ├── orchestrator.yaml       # P2 authors
│   │   ├── coding.yaml             # P3 authors
│   │   ├── progression.yaml        # P3 authors
│   │   ├── research.yaml           # P1 authors
│   │   ├── learning.yaml           # P3 authors
│   │   └── practice.yaml           # P3 authors
│   └── events.yaml                 # All event type definitions (P1 seeds, all read)
│
├── services/
│   ├── shared/                     # 🔒 SHARED — P1 owns, others read-only after week 1
│   │   ├── models/                 # Pydantic models: User, Session, Turn, CandidateModel
│   │   ├── db/                     # DB connection pool, migration runner
│   │   ├── events/                 # Internal event bus (publish/subscribe)
│   │   └── config_loader/          # YAML config loader + schema validator
│   │
│   ├── p1_platform/                # 👤 PERSON 1 — full ownership
│   │   ├── gateway/                # Node + Fastify: JWT auth, routing, WebSocket upgrade
│   │   ├── research/               # Tavily agent, company profile persistence
│   │   ├── persona/                # Persona + company config loader service
│   │   └── reasoning/              # LLM wrapper (prompt templates, logging)
│   │
│   ├── p2_interview/               # 👤 PERSON 2 — full ownership
│   │   ├── orchestrator/           # State machine, sub-agent lifecycle, thread tracker
│   │   ├── speech/                 # ASR + VAD + TTS + Hume + prosody pipeline
│   │   └── scaffolding/            # Classifier middleware + refusal enforcement
│   │
│   └── p3_learning/                # 👤 PERSON 3 — full ownership
│       ├── practice/               # Single-drill loop service
│       ├── learning/               # Guided learning engine
│       ├── coding/                 # Judge0 bridge + LeetCode query layer
│       └── progression/            # XP, levels, streaks, achievements, difficulty
│
├── web/                            # Next.js 14 — split by route ownership
│   ├── app/
│   │   ├── (p1)/                   # 👤 PERSON 1 pages
│   │   │   ├── onboarding/
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   ├── (p2)/                   # 👤 PERSON 2 pages
│   │   │   ├── interview/[sessionId]/
│   │   │   └── report/[sessionId]/
│   │   └── (p3)/                   # 👤 PERSON 3 pages
│   │       ├── practice/
│   │       ├── learn/[sessionId]/
│   │       ├── code/[sessionId]/
│   │       └── achievements/
│   ├── components/
│   │   ├── p1/                     # 👤 P1 components (onboarding wizard, research brief card)
│   │   ├── p2/                     # 👤 P2 components (mic controls, transcript view, radar chart)
│   │   ├── p3/                     # 👤 P3 components (drill picker, XP bar, achievement badge)
│   │   └── shared/                 # 🔒 SHARED — button, input, layout, nav (P1 seeds week 1)
│   └── lib/
│       ├── api/                    # Auto-generated from proto/ OpenAPI specs
│       └── hooks/                  # Each person adds their own hooks here (no conflicts by filename)
│
├── config/                         # Split by owner
│   ├── personas/                   # 👤 P2 owns (friendly.yaml, neutral.yaml, challenging.yaml)
│   ├── companies/                  # 👤 P1 owns (amazon.yaml, google.yaml, generic-*.yaml)
│   ├── modes/                      # 👤 P2 owns (learning.yaml, professional.yaml)
│   ├── formats/                    # 👤 P2 owns (recruiter_screen.yaml, technical.yaml, ...)
│   ├── achievements.yaml           # 👤 P3 owns
│   ├── rubrics.yaml                # 👤 P2 owns
│   └── practice_drills.yaml        # 👤 P3 owns
│
├── prompts/                        # Split by owner — each file has one owner
│   ├── p1_research_brief.md        # 👤 P1
│   ├── p2_classify_turn.md         # 👤 P2
│   ├── p2_generate_probe.md        # 👤 P2
│   ├── p2_generate_feedback.md     # 👤 P2
│   ├── p2_safe_clarification.md    # 👤 P2
│   ├── p2_streaming_predecide.md   # 👤 P2
│   ├── p2_scaffold_refusal.md      # 👤 P2
│   └── p3_socratic_step.md         # 👤 P3
│
├── infra/
│   ├── docker-compose.yml          # 👤 P1 owns
│   ├── migrations/                 # 👤 P1 owns ALL migrations (numbered, sequential)
│   │   ├── requests/               # P2 & P3 file migration requests here
│   │   ├── 001_users.sql
│   │   ├── 002_candidate_model.sql
│   │   ├── 003_sessions.sql
│   │   ├── 004_progression_events.sql
│   │   ├── 005_company_profiles.sql
│   │   └── 006_question_bank.sql
│   ├── terraform/                  # 👤 P1 owns
│   └── seed/
│       ├── question_bank/          # 👤 P2 owns (behavioral, system design questions)
│       └── leetcode/               # 👤 P3 owns (SQLite import script)
│
├── data/
│   └── leetcode.sqlite             # 👤 P3 owns (gitignored)
│
├── scripts/
│   ├── setup.sh                    # 👤 P1 owns
│   └── Makefile                    # 👤 P1 owns
│
└── .github/
    └── workflows/
        ├── ci-p1.yml               # 👤 P1 (gateway + research + persona tests)
        ├── ci-p2.yml               # 👤 P2 (orchestrator + speech + scaffolding tests)
        └── ci-p3.yml               # 👤 P3 (practice + learning + coding + progression tests)
```

---

## Ownership & Conflict Avoidance Rules

### 🔒 Shared Code (Locked After Week 1)

**`proto/`** — OpenAPI contracts
- Each person authors their own service's spec
- Contracts agreed in kickoff meeting before implementation
- After week 1, changes require all-hands review

**`services/shared/`** — Core models and utilities
- P1 writes base models and DB helpers in week 1
- After week 1, changes go through PR with all 3 reviewers
- This is the only true shared Python code

**`web/components/shared/`** — Design system
- P1 seeds Button, Input, Layout, Nav in week 1
- Additions require quick group check to avoid duplication

**`web/lib/api/`** — Auto-generated API clients
- Generated from `proto/` using `openapi-typescript`
- Nobody hand-edits this folder

### 📝 Migration Protocol

**P1 is the sole migration author.** P2 and P3 file requests:

1. Create a markdown file in `infra/migrations/requests/`
   - Example: `infra/migrations/requests/p2_add_turn_signals.md`
2. P1 reviews and merges into the numbered sequence
3. No two people ever touch the same `.sql` file

### 🔄 Sync Points (Only Times You Need to Coordinate)

| When | What | Who |
|---|---|---|
| Day 1 | Agree on all OpenAPI contracts in `proto/` | All 3 |
| Day 1 | Agree on shared Pydantic models in `services/shared/` | All 3 |
| End of week 1 | P1 delivers: DB up, shared models, design system stubs | P2 + P3 unblocked |
| Week 3 | P2 delivers: `TurnSignals` event schema | P3 can wire progression to it |
| Week 5 | P3 delivers: `session.completed` event | P2 can emit it from orchestrator |
| Week 7 | Integration pass: P2 orchestrator calls P3 progression | All 3 |

---

## Naming Conventions

**Topics** — dot-namespaced: `dsa.arrays`, `behavioral.leadership`, `system_design.scalability`

**Persona IDs** — kebab-case: `friendly`, `neutral`, `challenging`

**Company IDs** — kebab-case lowercase: `amazon`, `google`, `custom-{slug}`

**Database tables** — plural snake_case: `users`, `candidate_topics`, `xp_events`

**Event types** — dot-namespaced verbs: `session.started`, `xp.awarded`, `level.up`

**Service URLs** — `/{service}/v1/{resource}`: `/orchestrator/v1/sessions`, `/coding/v1/run`

---

## Test Layout

- **Unit tests** — alongside source: `services/*/tests/`
- **Integration tests** — `services/*/integration_tests/` (run against docker-compose)
- **E2E tests** — `e2e/` at repo root (full stack)
- **Eval sets** — `services/orchestrator/eval/` (labeled examples for prompt regression)

---

## Quick Reference: What Goes Where

| Question | Location |
|---|---|
| How does orchestrator decide probe vs advance? | `services/p2_interview/orchestrator/src/turn_dispatch.py` |
| Where is the XP formula? | `services/p3_learning/progression/src/xp.py` + `config/modes/*.yaml` |
| Where is friendly persona tone defined? | `config/personas/friendly.yaml` |
| Where is Tavily query for research? | `services/p1_platform/research/src/tavily_client.py` + `prompts/p1_research_brief.md` |
| Where do code submissions get scored? | `services/p3_learning/coding/src/scoring.py` + `config/rubrics.yaml` |
| Where is 8-metric radar computed? | `services/p2_interview/orchestrator/src/feedback.py` + `config/rubrics.yaml` |
