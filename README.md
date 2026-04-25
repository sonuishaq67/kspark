# RoleReady AI

> Compare your resume to the job description, find your gaps, and practice the interview that matters — without getting answers ghostwritten for you.

**Hackathon:** Kiro Spark Challenge  
**Stack:** FastAPI + SQLite + Next.js 14 + TypeScript + Tailwind + Groq LLM

---

## What It Does

1. You paste a job description and your resume.
2. The app compares them and shows a **readiness gap map** — strong matches, partial matches, missing evidence.
3. You get a **prep brief** before the interview starts.
4. The AI runs an **adaptive mock interview** that probes your exact weak areas.
5. When you ask for a perfect answer, the AI **refuses and coaches** instead.
6. After the session you get a **learning-focused report** with scores, gap analysis, and a next practice plan.
7. The **dashboard** shows your session history.

---

## Quick Start

```bash
# 1. Clone and configure
git clone <repo-url>
cd interview-coach
cp .env.example .env   # fill in GROQ_API_KEY (optional — see mock mode below)

# 2. Start everything
make up

# 3. Open http://localhost:3000
```

### No API keys? Run in full mock mode

```bash
MOCK_LLM=1 make dev
```

Mock mode runs the complete flow — gap analysis, interview, report — with deterministic demo data. No Groq, no Deepgram, no ElevenLabs needed.

---

## Environment Variables

```bash
# .env
GROQ_API_KEY=your_key_here          # LLM — leave blank to auto-enable mock mode
DEEPGRAM_API_KEY=your_key_here      # ASR (optional — voice mode only)
ELEVENLABS_API_KEY=your_key_here    # TTS (optional — voice mode only)
ELEVENLABS_VOICE_ID=your_voice_id   # TTS voice (optional)
MOCK_LLM=0                          # Set to 1 to force mock mode
MOCK_ASR=0                          # Set to 1 to use hardcoded transcripts
MOCK_TTS=0                          # Set to 1 to skip audio (text-only)
SQLITE_PATH=data/interview_coach.db
```

---

## Demo Flow (Judge Path)

1. Open `http://localhost:3000` → lands on `/practice/setup`
2. Enter target role, paste a job description, paste a resume (or click "Load Demo Data")
3. Click "Analyze My Readiness" → see the gap map
4. Review the prep brief → click "Start Interview"
5. Answer the first question vaguely
6. AI detects the missing gap and asks a targeted follow-up
7. Type: "Can you write the perfect answer for me?"
8. AI refuses → **Agency Guardrail Activated** badge appears
9. Click "Finish Interview" → see the full report
10. Navigate to `/dashboard` → see session history

---

## MVP Scope

| Feature | Status |
|---------|--------|
| JD + resume input | ✅ MVP |
| Readiness gap map | ✅ MVP |
| Prep brief | ✅ MVP |
| Adaptive typed interview | ✅ MVP |
| Ghostwriting refusal guardrail | ✅ MVP |
| Live gap tracking panel | ✅ MVP |
| Final feedback report | ✅ MVP |
| Dashboard with session history | ✅ MVP |
| Mock/demo mode (no API keys) | ✅ MVP |
| SQLite persistence | ✅ MVP |
| Voice mode (ASR/TTS) | 🔶 Optional |
| Live coding round | 🚫 Roadmap |
| XP / levels / streaks | 🚫 Roadmap |
| Recruiter dashboard | 🚫 Roadmap |
| Full auth / accounts | 🚫 Roadmap |
| Postgres / Redis | 🚫 Roadmap |

---

## Project Structure

```
interview-coach/
├── backend/                    # FastAPI — single process
│   ├── main.py                 # App entry, routes
│   ├── api/
│   │   ├── sessions.py         # Session + turn + report endpoints
│   │   └── readiness.py        # Gap analysis endpoint (NEW)
│   ├── db/                     # SQLite schema + async queries
│   ├── llm/                    # Groq client + prompt loader + mock responses
│   ├── orchestrator/           # State machine, sub-agent, thread tracker
│   ├── speech/                 # ASR + TTS + WebSocket handler
│   ├── config/                 # YAML config loader
│   ├── questions/              # Demo question loader
│   └── tests/                  # pytest unit tests
├── web/                        # Next.js 14 frontend
│   ├── app/
│   │   ├── practice/           # Step-based flow (NEW)
│   │   │   ├── setup/          # Step 1: JD + resume input
│   │   │   ├── gap-map/        # Step 2: Readiness gap map
│   │   │   ├── prep-brief/     # Step 3: Prep brief
│   │   │   ├── interview/      # Step 4: Adaptive interview room
│   │   │   └── report/         # Step 5: Feedback report
│   │   ├── dashboard/          # Session history
│   │   └── interview/          # Legacy voice interview (preserved)
│   ├── components/
│   │   ├── roleready/          # New RoleReady components (NEW)
│   │   ├── p2/                 # Legacy interview components
│   │   └── shared/             # Layout, nav
│   └── lib/                    # API client, WebSocket hook
├── prompts/                    # LLM prompt templates
├── config/                     # Persona YAML configs
├── database/
│   ├── migrations/             # SQL migrations
│   └── seed_data/              # Demo data
├── evals/                      # Golden test cases
├── docker-compose.yml
├── Makefile
└── .env.example
```

---

## How We Used Kiro

- **Steering docs** (`.kiro/steering/`) lock product direction, tech stack, responsible AI principles, and hackathon scope — so every decision stays aligned.
- **Specs** (`.kiro/specs/roleready-ai-mvp/`) break the build into three independent workstreams with clear API contracts between them.
- **Task files** divide work by person with zero overlap — Ishaq owns gap analysis, Shivam owns the interview loop, Varad owns reporting and dashboard.
- **Mock mode** and eval cases keep the demo reliable regardless of API key availability.
- Kiro helped turn a broad platform idea into a focused, testable hackathon MVP with a clear demo path.

---

## Team Task Files

| Person | Workstream | File |
|--------|-----------|------|
| Ishaq | JD/Resume Gap Engine | `.kiro/specs/roleready-ai-mvp/tasks-ishaq.md` |
| Shivam | Adaptive Interview Loop | `.kiro/specs/roleready-ai-mvp/tasks-shivam.md` |
| Varad | Dashboard & Reporting | `.kiro/specs/roleready-ai-mvp/tasks-varad.md` |

---

## Development Commands

```bash
make dev        # Start backend + frontend locally (no Docker)
make up         # docker-compose up --build
make down       # docker-compose down
make logs       # Tail container logs
make test       # Run pytest
```

### Local (no Docker)

```bash
# Backend (using conda)
cd backend
conda create -n roleready python=3.11 -y
conda activate roleready
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd web
npm install
npm run dev     # http://localhost:3000
```
