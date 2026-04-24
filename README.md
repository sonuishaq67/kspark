# Interview Coach

A voice-driven AI interview preparation platform with multi-agent orchestration, dynamic company research, live coding, multimodal scoring, and game-style progression.

## 🚀 Quick Start

**New to the project?** Read [`GETTING_STARTED.md`](GETTING_STARTED.md) first.

**Team member?** Check your ownership in [`TEAM_DIVISION.md`](TEAM_DIVISION.md).

```bash
# 1. Clone and setup
git clone <repo-url>
cd interview-coach
cp .env.example .env  # Add your API keys

# 2. Start infrastructure
docker-compose up -d

# 3. Run migrations and seed data
make setup

# 4. Start your services (see TEAM_DIVISION.md for your services)
# 5. Start web frontend
cd web && npm install && npm run dev
```

## 📁 Project Structure

```
interview-coach/
├── services/
│   ├── shared/           # 🔒 Shared models (P1 owns)
│   ├── p1_platform/      # 👤 P1: Gateway, research, persona, reasoning
│   ├── p2_interview/     # 👤 P2: Orchestrator, speech, scaffolding
│   └── p3_learning/      # 👤 P3: Practice, learning, coding, progression
├── web/                  # Next.js frontend (split by route ownership)
├── proto/                # 🔒 API contracts (finalize Day 1)
├── config/               # YAML configs (split by owner)
├── prompts/              # LLM prompts (split by owner)
├── infra/                # 👤 P1: Docker, migrations, Terraform
└── docs/                 # Spec files (requirements, design, tasks)
```

## 📚 Documentation

### For Implementation
- [`TEAM_DIVISION.md`](TEAM_DIVISION.md) — Ownership boundaries and sync points
- [`GETTING_STARTED.md`](GETTING_STARTED.md) — Setup instructions
- [`tasks.md`](tasks.md) — Implementation task list

### For Understanding
- [`requirements.md`](requirements.md) — User stories with acceptance criteria
- [`design.md`](design.md) — Architecture, components, sequence flows, ADRs
- [`product.md`](product.md) — Vision, principles, the bets we're making
- [`tech.md`](tech.md) — Stack, constraints, integration boundaries

## Foundational bets (read these before anything else)

1. **The orchestrator listens.** A stateful orchestrator owns session state and a thread tracker. Sub-agents handle individual questions with focused context. This is the differentiator vs scripted-feeling competitors.
2. **The agent scaffolds, never ghostwrites.** It refuses model-answer requests and offers Socratic hints instead. This is enforced in prompts and validated in code.
3. **Progression is earned, not granted.** XP, levels, and unlocks come from demonstrated skill against a per-user candidate model — not session count.
4. **Specs and configs drive behavior.** Personas, company profiles, achievement criteria, and rubrics live in editable YAML. Editing them changes the product without code changes.
5. **Local where it makes sense.** Code execution, the question bank, and session caches run locally. Only voice (ElevenLabs), reasoning (Anthropic), emotion (Hume), and research (Tavily) go to external APIs.

## What's explicitly out of scope

- Video capture, gaze tracking, posture and affect analysis (deferred to a follow-up spec)
- Native mobile apps (web responsive only)
- Multilingual support (English only)
- Real-time assistance during actual non-practice interviews — this is a practice tool, not a copilot
- Peer mock interview matching and community features

- [`structure.md`](structure.md) — Monorepo layout and naming conventions

## 🎯 Foundational Bets

1. **The orchestrator listens** — Stateful orchestrator + per-question sub-agents (not scripted)
2. **Scaffolding, not ghostwriting** — Agent refuses model answers, offers Socratic hints
3. **Progression is earned** — XP/levels based on demonstrated skill, not session count
4. **Configs drive behavior** — Personas, companies, rubrics in YAML (no code changes)
5. **Local where it matters** — Judge0, LeetCode bank, Redis cache run locally

## 👥 Team Ownership

| Person | Services | Web Routes | Config |
|--------|----------|------------|--------|
| **P1** | gateway, research, persona, reasoning | /onboarding, /dashboard, /profile, /settings | companies/ |
| **P2** | orchestrator, speech, scaffolding | /interview, /report | personas/, modes/, formats/, rubrics.yaml |
| **P3** | practice, learning, coding, progression | /practice, /learn, /code, /achievements | achievements.yaml, practice_drills.yaml |

See [`TEAM_DIVISION.md`](TEAM_DIVISION.md) for detailed responsibilities and sync points.

## 🔧 Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind, CodeMirror 6
- **Edge:** Node.js 20 + Fastify (WebSocket)
- **Services:** Python 3.11 + FastAPI
- **Data:** Postgres 16 + pgvector, Redis 7, SQLite (LeetCode)
- **External APIs:** Anthropic, ElevenLabs, Deepgram, Hume, Tavily
- **Local:** Judge0 (Docker)

## 📋 What's Out of Scope

- Video capture, gaze tracking, posture analysis (deferred)
- Native mobile apps (web responsive only)
- Multilingual support (English only)
- Real-time copilot during actual interviews (practice tool only)
- Peer mock interview matching

## 🤝 Contributing

1. Check [`TEAM_DIVISION.md`](TEAM_DIVISION.md) for your ownership
2. Never edit files outside your ownership without coordination
3. Migrations: Only P1 touches `.sql` files (others file requests)
4. Shared code: Changes require PR review from all 3
5. Proto contracts: Agreed on Day 1, changes need all 3 to approve

## 📞 Support

- Daily standup: 15 min sync on blockers
- Slack/Discord: `#p1-platform`, `#p2-interview`, `#p3-learning`, `#integration`
- PR reviews: Tag relevant person for their owned files only

---

**Ready to start?** → [`GETTING_STARTED.md`](GETTING_STARTED.md)
