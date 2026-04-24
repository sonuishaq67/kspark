# Interview Coach — Team Handoff Document

**Date**: April 24, 2026  
**Status**: Initial commit — ready for team to start  
**Repository**: interview-coach

---

## What's in This Commit

This is the **foundation commit** for the Interview Coach project. It contains:

✅ Complete folder structure organized for 3-person parallel development  
✅ Comprehensive documentation (README, STRUCTURE, TEAM_DIVISION)  
✅ Clear ownership boundaries to minimize merge conflicts  
✅ Product vision, technical design, and requirements  
✅ Task breakdown with week-by-week milestones  
✅ .gitignore configured for Node, Python, and data files  

**No code yet** — this is the blueprint. Implementation starts now.

---

## Quick Start for Each Person

### Person 1 — Platform & Infrastructure

**Your folders**:
- `services/p1_platform/` (gateway, research, persona, reasoning)
- `services/shared/` (you own this after seeding it)
- `web/app/(p1)/` (onboarding, dashboard, profile, settings)
- `web/components/p1/` + `web/components/shared/` (seed design system)
- `infra/` (docker-compose, migrations, terraform)
- `config/companies/`
- `prompts/p1_*.md`

**Week 1 priority** (unblocks P2 & P3):
1. Set up `docker-compose.yml` (Postgres, Redis, Judge0)
2. Write all 6 DB migrations
3. Create `services/shared/models/` (User, Session, Turn, CandidateModel, Event)
4. Create `services/shared/db/`, `services/shared/events/`, `services/shared/config_loader/`
5. Seed `web/components/shared/` (Button, Input, Layout, Nav)
6. Seed all `proto/openapi/*.yaml` specs with agreed contracts
7. Create `.env.example` with all API keys

**Read**:
- `TEAM_DIVISION.md` — your full task list
- `services/p1_platform/README.md` — your services overview
- `tech.md` — stack decisions and constraints

---

### Person 2 — Interview Engine & Voice

**Your folders**:
- `services/p2_interview/` (orchestrator, speech, scaffolding)
- `web/app/(p2)/` (interview, report)
- `web/components/p2/` (mic controls, transcript view, radar chart)
- `config/personas/`, `config/modes/`, `config/formats/`, `config/rubrics.yaml`
- `prompts/p2_*.md` (7 prompt templates)
- `infra/seed/question_bank/`

**Week 1-2 priority** (can start in parallel with P1):
1. Author all 7 prompt templates in `prompts/p2_*.md`
2. Create persona configs (friendly, neutral, challenging)
3. Create mode configs (learning, professional)
4. Create format configs (recruiter_screen, technical, etc.)
5. Create `config/rubrics.yaml` with 8-metric definitions
6. Seed 200+ interview questions with gap hints in `infra/seed/question_bank/`

**Read**:
- `TEAM_DIVISION.md` — your full task list
- `services/p2_interview/README.md` — your services overview
- `design.md` — architecture, especially §2.3-2.5 (orchestrator, sub-agents, streaming pre-decision)

---

### Person 3 — Learning, Coding & Progression

**Your folders**:
- `services/p3_learning/` (practice, learning, coding, progression)
- `web/app/(p3)/` (practice, learn, code, achievements)
- `web/components/p3/` (drill picker, XP bar, achievement badge, CodeMirror wrapper)
- `config/achievements.yaml`, `config/practice_drills.yaml`
- `prompts/p3_socratic_step.md`
- `infra/seed/leetcode/`
- `data/leetcode.sqlite`

**Week 1-2 priority** (can start in parallel with P1):
1. Create `config/practice_drills.yaml` with 10+ drill types
2. Create `config/achievements.yaml` with 20+ achievements
3. Author `prompts/p3_socratic_step.md`
4. Write LeetCode SQLite import script in `infra/seed/leetcode/`
5. Test import: `make setup-leetcode` should produce `data/leetcode.sqlite`

**Read**:
- `TEAM_DIVISION.md` — your full task list
- `services/p3_learning/README.md` — your services overview
- `design.md` — §2.14-2.15 (progression engine, difficulty manager)

---

## Day 1 Kickoff Meeting (Required)

**Attendees**: All 3 people  
**Duration**: 2 hours  
**Agenda**:

1. **Contracts (60 min)** — Agree on all OpenAPI specs in `proto/openapi/`
   - What endpoints does each service expose?
   - What's the request/response shape?
   - What events does each service publish/subscribe to?
   - Document in `proto/events.yaml`

2. **Shared models (30 min)** — Agree on Pydantic models in `services/shared/models/`
   - `User` — what fields?
   - `Session` — what fields?
   - `Turn` — what fields?
   - `CandidateModel` — what fields?
   - `Event` — base class shape?

3. **Communication protocol (30 min)**
   - Daily async standups (where? Slack? Discord?)
   - How to request contract changes after week 1
   - How to request migrations (P2 & P3 → P1)
   - Merge conflict resolution

**Output**: 
- All `proto/openapi/*.yaml` files have agreed schemas
- `proto/events.yaml` has all event types defined
- `services/shared/models/` structure agreed on (P1 implements)

---

## File Structure Overview

```
interview-coach/
├── README.md                    # Project overview
├── STRUCTURE.md                 # Folder structure & ownership rules
├── TEAM_DIVISION.md             # Task breakdown by person
├── HANDOFF.md                   # This file
├── product.md                   # Product vision & bets
├── design.md                    # Technical architecture
├── requirements.md              # User stories & acceptance criteria
├── tasks.md                     # Original task list (now superseded by TEAM_DIVISION.md)
├── tech.md                      # Stack decisions
├── .gitignore                   # Ignore node_modules, venv, data, etc.
│
├── proto/                       # 🔒 SHARED — API contracts
│   ├── README.md
│   ├── openapi/                 # OpenAPI 3.0 specs (one per service)
│   └── events.yaml              # Event type definitions
│
├── services/
│   ├── shared/                  # 🔒 SHARED — P1 owns
│   │   ├── README.md
│   │   ├── models/              # Pydantic models
│   │   ├── db/                  # DB pool, migration runner
│   │   ├── events/              # Event bus
│   │   └── config_loader/       # YAML loader + validator
│   │
│   ├── p1_platform/             # 👤 PERSON 1
│   │   ├── README.md
│   │   ├── gateway/             # Node + Fastify
│   │   ├── research/            # Tavily agent
│   │   ├── persona/             # Config loader service
│   │   └── reasoning/           # LLM wrapper
│   │
│   ├── p2_interview/            # 👤 PERSON 2
│   │   ├── README.md
│   │   ├── orchestrator/        # State machine, sub-agents
│   │   ├── speech/              # ASR, TTS, Hume, prosody
│   │   └── scaffolding/         # Ghostwriting prevention
│   │
│   └── p3_learning/             # 👤 PERSON 3
│       ├── README.md
│       ├── practice/            # Single-drill loop
│       ├── learning/            # Guided learning
│       ├── coding/              # Judge0 bridge
│       └── progression/         # XP, levels, streaks
│
├── web/                         # Next.js 14
│   ├── README.md
│   ├── app/
│   │   ├── (p1)/                # 👤 P1 pages
│   │   ├── (p2)/                # 👤 P2 pages
│   │   └── (p3)/                # 👤 P3 pages
│   ├── components/
│   │   ├── p1/                  # 👤 P1 components
│   │   ├── p2/                  # 👤 P2 components
│   │   ├── p3/                  # 👤 P3 components
│   │   └── shared/              # 🔒 SHARED (P1 seeds)
│   └── lib/
│       ├── api/                 # Auto-generated (don't edit)
│       └── hooks/               # Each person adds their own
│
├── config/                      # Runtime YAML configs
│   ├── personas/                # 👤 P2 owns
│   ├── companies/               # 👤 P1 owns
│   ├── modes/                   # 👤 P2 owns
│   ├── formats/                 # 👤 P2 owns
│   ├── achievements.yaml        # 👤 P3 owns
│   ├── rubrics.yaml             # 👤 P2 owns
│   └── practice_drills.yaml     # 👤 P3 owns
│
├── prompts/                     # LLM prompt templates
│   ├── p1_research_brief.md     # 👤 P1
│   ├── p2_classify_turn.md      # 👤 P2
│   ├── p2_generate_probe.md     # 👤 P2
│   ├── p2_generate_feedback.md  # 👤 P2
│   ├── p2_safe_clarification.md # 👤 P2
│   ├── p2_streaming_predecide.md# 👤 P2
│   ├── p2_scaffold_refusal.md   # 👤 P2
│   └── p3_socratic_step.md      # 👤 P3
│
├── infra/
│   ├── docker-compose.yml       # 👤 P1 owns
│   ├── migrations/              # 👤 P1 owns (numbered SQL)
│   │   └── requests/            # P2 & P3 file requests here
│   ├── terraform/               # 👤 P1 owns
│   └── seed/
│       ├── question_bank/       # 👤 P2 owns
│       └── leetcode/            # 👤 P3 owns
│
├── data/
│   └── leetcode.sqlite          # 👤 P3 owns (gitignored)
│
├── scripts/
│   ├── setup.sh                 # 👤 P1 owns
│   └── Makefile                 # 👤 P1 owns
│
└── .github/
    └── workflows/
        ├── ci-p1.yml            # 👤 P1
        ├── ci-p2.yml            # 👤 P2
        └── ci-p3.yml            # 👤 P3
```

---

## Key Principles

### 1. Vertical Ownership
Each person owns a complete slice: services + web pages + configs + prompts. You rarely touch someone else's folder.

### 2. Contracts First
The only integration surface is `proto/` (OpenAPI specs) and `services/shared/events/` (event bus). Agree on these Day 1, then build independently.

### 3. Shared Code is Locked
`services/shared/` and `web/components/shared/` are locked after week 1. Changes require all-hands review.

### 4. Migrations are Centralized
P1 is the sole migration author. P2 & P3 file requests in `infra/migrations/requests/`, P1 merges into numbered sequence.

### 5. Sync Points are Minimal
Only 5 sync points across 9 weeks (see `TEAM_DIVISION.md`). Most of the time you work independently.

---

## Environment Setup

### Required Tools
- **Docker Desktop** (or compatible runtime)
- **Node.js 20+**
- **Python 3.11+**
- **pnpm** (for web)
- **Git**

### API Keys (for `.env`)
- `ANTHROPIC_API_KEY` — Claude Opus/Sonnet
- `OPENAI_API_KEY` — GPT-4 fallback
- `DEEPGRAM_API_KEY` — Streaming ASR
- `ELEVENLABS_API_KEY` — TTS
- `HUME_API_KEY` — Voice emotion
- `TAVILY_API_KEY` — Company research

P1 will create `.env.example` with all keys listed.

---

## Success Metrics

### End of Week 1
- [ ] All 3 people can run `make setup` and see Postgres + Redis + Judge0 up
- [ ] All 3 people can import from `services/shared/models`
- [ ] All 3 people have their service folders scaffolded
- [ ] All `proto/openapi/*.yaml` specs are agreed on

### End of Week 5
- [ ] P1: Can onboard a user and see them in the DB
- [ ] P2: Can run a mock interview session (even if feedback is stubbed)
- [ ] P3: Can run a practice drill and award XP

### End of Week 9
- [ ] End-to-end flow works: onboard → diagnostic → practice → interview → report with XP
- [ ] All 3 CI pipelines green
- [ ] Ready for beta recruitment (25-40 users)

---

## Communication Protocol

### Daily Async Standups
Post in team chat:
- ✅ What I shipped yesterday
- 🚀 What I'm shipping today
- 🚧 Any blockers (especially contract changes)

### Contract Changes (After Week 1)
If you need to change a `proto/` contract:
1. Post in team chat with rationale
2. Wait for acknowledgment from affected person
3. Update the OpenAPI spec
4. Run `make generate-api-clients`
5. Commit and push

### Migration Requests (P2 & P3 → P1)
1. Create `infra/migrations/requests/p{X}_description.md` with SQL
2. Tag P1 in PR or chat
3. P1 merges into numbered sequence within 24h

### Merge Conflicts
If you hit a merge conflict:
1. Check `STRUCTURE.md` — you might be in someone else's folder
2. If it's in `services/shared/` or `proto/`, sync with the owner
3. If it's in your folder, you have final say

---

## Next Steps

1. **Clone the repo** and read this handoff document
2. **Schedule Day 1 kickoff meeting** (2 hours, all 3 people)
3. **Read your assigned docs**:
   - Everyone: `README.md`, `STRUCTURE.md`, `TEAM_DIVISION.md`
   - P1: `services/p1_platform/README.md`, `tech.md`
   - P2: `services/p2_interview/README.md`, `design.md` §2.3-2.5
   - P3: `services/p3_learning/README.md`, `design.md` §2.14-2.15
4. **Day 1 kickoff**: Agree on contracts and shared models
5. **Week 1**: P1 delivers foundation, P2 & P3 work on configs/prompts
6. **Week 2+**: Build your slice independently

---

## Questions?

- **Architecture questions**: Read `design.md` (especially the ADRs at the end)
- **Product questions**: Read `product.md` (the 5 bets)
- **Requirements questions**: Read `requirements.md` (user stories with acceptance criteria)
- **Task questions**: Read `TEAM_DIVISION.md` (week-by-week breakdown)
- **Folder questions**: Read `STRUCTURE.md` (ownership rules)

If still unclear, ask in team chat. The person who owns that folder has final say.

---

## Good Luck! 🚀

This is a well-structured project with clear boundaries. If you follow the ownership rules and sync at the designated points, you'll build this in parallel with minimal friction.

The product is ambitious but achievable. The architecture is sound. The tasks are scoped. Now go build it.

---

**Commit hash**: (will be filled after first commit)  
**Branch**: `main`  
**Next milestone**: End of Week 1 — Foundation complete
