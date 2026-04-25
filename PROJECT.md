# RoleReady AI — Complete Project Reference

This document describes the entire project: what it does, how it's structured, how every service communicates, every API endpoint, every data model, every file that matters, and how to run it. An AI agent reading only this file should be able to understand and modify any part of the codebase.

---

## 1. What This Is

RoleReady AI is a voice-first AI interview coach. A candidate provides their resume, a job description, and a target company. The system:

1. Researches the company and role (Tavily web search, cached in SQLite)
2. Identifies skill gaps between the resume and the JD
3. Runs an adaptive mock interview that probes those specific gaps
4. Refuses to ghostwrite answers — coaches instead
5. Generates a learning-focused evaluation report

The product supports six session types through one unified AI Core service, from quick 15-minute behavioral practice to full 60-minute mock interviews.

---

## 2. Architecture Overview

Three services run independently and communicate via HTTP/WebSocket:

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Next.js 14)  :3000                                │
│  /practice/setup → /practice/interview → /practice/report   │
│  /dashboard                                                 │
└──────────┬──────────────────────────────┬───────────────────┘
           │ REST (fetch)                 │ WebSocket
           ▼                              ▼
┌──────────────────────┐    ┌──────────────────────────────────┐
│ Legacy Backend :8000 │    │ AI Core :8001                    │
│ FastAPI + SQLite     │    │ FastAPI + OpenAI + ElevenLabs    │
│                      │    │                                  │
│ • Tavily research    │    │ • Session planner                │
│ • Gap analysis       │    │ • LangGraph orchestration        │
│ • Report persistence │    │ • Question generation            │
│ • Dashboard API      │    │ • Follow-up selection            │
│ • Groq LLM client    │    │ • Response generation (streaming)│
│                      │    │ • Ghostwriting guardrail         │
│ SQLite: sessions,    │    │ • ElevenLabs TTS (streaming MP3) │
│ turns, gaps, reports,│    │ • ElevenLabs/Whisper STT         │
│ research_cache       │    │ • Evaluation report              │
└──────────────────────┘    │ • In-process session store       │
                            └──────────────────────────────────┘
```

### Why two backends?

The legacy backend (`backend/`) was built first by the full team (3 people). It owns the database, research agent, gap analysis, and reporting. The AI Core (`ai-core/`) was built as a standalone microservice for the interview orchestration — it uses OpenAI instead of Groq, supports multiple session types, and handles real-time voice via WebSocket. They run side by side. The frontend talks to both.

---

## 3. Folder Structure

```
.
├── .env                          # All API keys (gitignored)
├── .env.example                  # Template for .env
├── PROJECT.md                    # THIS FILE
├── Makefile                      # make dev / make backend / make ai-core / make web
├── docker-compose.yml            # Legacy backend + frontend (no ai-core yet)
│
├── backend/                      # Legacy FastAPI backend (:8000)
│   ├── main.py                   # App entry point, lifespan, CORS, routes
│   ├── requirements.txt          # Python deps (groq, aiosqlite, etc.)
│   ├── api/
│   │   └── sessions.py           # REST endpoints: /api/sessions, /api/questions, etc.
│   ├── config/
│   │   └── loader.py             # YAML persona loader (friendly/neutral/challenging)
│   ├── db/
│   │   ├── init.py               # SQLite init, runs schema.sql on startup
│   │   ├── schema.sql            # All tables: users, sessions, turns, gaps, reports, research_cache
│   │   ├── queries.py            # Typed async query functions
│   │   └── cache_queries.py      # Tavily research cache queries
│   ├── llm/
│   │   ├── client.py             # Groq LLM wrapper (chat, chat_json)
│   │   ├── prompts.py            # Prompt template loader (reads prompts/*.md)
│   │   ├── mock_responses.py     # Deterministic mock responses for MOCK_LLM=1
│   │   └── tavilyresearch.py     # Tavily web search + SQLite cache
│   ├── orchestrator/
│   │   ├── state.py              # SessionState dataclass, in-process store
│   │   ├── session_manager.py    # Session lifecycle: start, process_turn, end
│   │   ├── sub_agent.py          # Per-turn: classify → probe/advance/refuse
│   │   └── thread_tracker.py     # Per-question gap tracking, probe count
│   ├── questions/
│   │   └── loader.py             # Loads demo_questions.yaml
│   ├── speech/
│   │   ├── asr.py                # Deepgram ASR (not used by AI Core)
│   │   ├── tts.py                # ElevenLabs TTS (not used by AI Core)
│   │   └── websocket_handler.py  # Legacy WS handler
│   └── tests/
│       ├── test_orchestrator.py   # Thread tracker + sub-agent tests
│       ├── test_llm.py            # Prompt loading + chat_json tests
│       └── test_report.py         # Report generation tests
│
├── ai-core/                      # AI Core microservice (:8001)
│   ├── .env                      # OpenAI + ElevenLabs keys (gitignored)
│   ├── .env.example
│   ├── requirements.txt          # Python deps (openai, langgraph, elevenlabs)
│   ├── pyproject.toml
│   ├── app/
│   │   ├── main.py               # FastAPI entry, lifespan, CORS, WS route, health
│   │   ├── config.py             # pydantic-settings config
│   │   ├── api/
│   │   │   ├── sessions.py       # REST: /sessions/start, /text-test, /end, /report, /status
│   │   │   └── websocket.py      # WebSocket handler: audio_chunk, speech_ended, TTS streaming
│   │   ├── core/
│   │   │   ├── orchestrator.py   # Central coordinator: start_session, process_turn, end_session
│   │   │   ├── session_planner.py # Converts session_type + context → SessionPlan with phases
│   │   │   ├── context_loader.py  # Parses upstream research context file
│   │   │   └── memory.py          # Rolling conversation summary, turn compaction
│   │   ├── agents/
│   │   │   ├── question_generator.py  # Background: generates 3-5 follow-up candidates
│   │   │   ├── followup_selector.py   # Fast LLM call: picks best question
│   │   │   ├── response_generator.py  # Streaming response + ghostwriting guardrail
│   │   │   └── evaluator.py           # End-of-session report with rubric scoring
│   │   ├── graphs/
│   │   │   └── interview_graph.py     # LangGraph StateGraph (compiled, not actively used yet)
│   │   ├── models/
│   │   │   ├── session.py        # InterviewSession, SessionPlan, TurnRecord, enums, in-process store
│   │   │   ├── events.py         # WebSocket event Pydantic models
│   │   │   └── evaluation.py     # EvaluationReport, MetricScore
│   │   ├── services/
│   │   │   ├── openai_service.py # OpenAI wrapper: chat, chat_json, chat_stream + mock fallback
│   │   │   ├── tts_service.py    # ElevenLabs TTS: synthesize_stream, synthesize_bytes
│   │   │   └── stt_service.py    # STT: ElevenLabs → Whisper fallback
│   │   └── utils/
│   │       ├── prompts.py        # Loads ai-core/prompts/*.md
│   │       ├── latency.py        # LatencyTracker: speech_end → first_token → first_audio
│   │       └── logging.py        # Logging config
│   └── prompts/
│       ├── interviewer.md         # Core interviewer behavior rules
│       ├── session_planner.md     # Session plan generation
│       ├── question_generator.md  # Background question generation
│       ├── followup_selector.md   # Fast follow-up selection
│       ├── evaluator.md           # General evaluation report
│       └── coding_evaluator.md    # Coding-specific evaluation
│
├── web/                          # Next.js 14 frontend (:3000)
│   ├── package.json              # next 14.2.35, react 18, tailwindcss 3.4
│   ├── next.config.mjs           # Env vars: NEXT_PUBLIC_API_URL, AI_CORE_URL, WS_URL
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx            # Root layout: dark theme, bg-gray-950
│   │   ├── page.tsx              # Redirects to /dashboard
│   │   ├── globals.css           # Tailwind imports
│   │   ├── dashboard/page.tsx    # Session list + stats (server component)
│   │   ├── practice/
│   │   │   ├── setup/page.tsx    # Session config: type, mode, difficulty, resume, JD
│   │   │   ├── interview/page.tsx # Voice-first interview room (client component)
│   │   │   └── report/page.tsx   # Structured report with scores, gaps, action plan
│   │   ├── interview/
│   │   │   ├── new/page.tsx      # Legacy: persona + mode selection
│   │   │   └── [sessionId]/page.tsx # Legacy: text-based interview room
│   │   └── report/
│   │       └── [sessionId]/page.tsx # Legacy: TLDR + question breakdown
│   ├── components/
│   │   ├── shared/
│   │   │   └── Layout.tsx        # Nav bar + max-w-6xl container
│   │   ├── p2/                   # Legacy interview components
│   │   │   ├── MicButton.tsx
│   │   │   ├── TranscriptPanel.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── QuestionBreakdown.tsx
│   │   │   ├── SessionCard.tsx
│   │   │   └── TLDRCard.tsx
│   │   └── roleready/           # New RoleReady components
│   │       ├── InterviewRoom.tsx  # Voice-first: orb + mic + WS + transcript drawer
│   │       ├── VoiceOrb.tsx       # Canvas-animated blob: idle/listening/thinking/speaking
│   │       ├── TranscriptBubble.tsx
│   │       ├── LiveGapPanel.tsx   # Phase progress + timer
│   │       ├── GhostwritingGuardrailBadge.tsx
│   │       ├── StepProgress.tsx   # 5-step flow indicator
│   │       ├── ReportSummary.tsx  # Report header with readiness score
│   │       ├── ScoreCard.tsx      # Individual dimension score (1-10)
│   │       ├── FollowUpAnalysis.tsx
│   │       ├── NextPracticePlan.tsx
│   │       └── DashboardStats.tsx
│   └── lib/
│       ├── types.ts              # All TypeScript interfaces
│       ├── api.ts                # Typed fetch client for both backends
│       ├── useMicrophone.ts      # MediaRecorder → WS audio_chunk + volume tracking
│       └── useInterviewSocket.ts # WS connection, audio playback queue, state management
│
├── config/
│   ├── personas/
│   │   ├── friendly.yaml         # Warm, encouraging
│   │   ├── neutral.yaml          # Professional, matter-of-fact
│   │   └── challenging.yaml      # Direct, no praise
│   └── README.md
│
├── prompts/                      # Legacy backend prompts
│   ├── classify_turn.md          # Turn classification: complete/partial/clarify/stall
│   ├── generate_probe.md         # Follow-up probe generation
│   ├── generate_feedback.md      # TLDR feedback generation
│   ├── scaffold_refusal.md       # Ghostwriting refusal rules
│   └── report_generator.md       # Structured report generation
│
├── database/
│   ├── seed_data/
│   │   └── demo_questions.yaml   # 3 demo questions with gap_hints
│   └── migrations/
│       ├── 001_demo_minimal.sql
│       └── 002_roleready_extensions.sql  # gaps + reports tables
│
└── data/                         # SQLite DB file (gitignored)
    └── interview_coach.db
```

---

## 4. Services & How to Run Them

### Environment Variables

Create `.env` in the project root (and copy to `backend/.env`). Create `ai-core/.env` separately.

**Root `.env` (used by legacy backend + frontend):**
```
OPENAI_API_KEY=sk-...
GROQ_API_KEY=               # optional, legacy backend uses Groq
TAVILY_API_KEY=tvly-...     # required for research agent
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
DEEPGRAM_API_KEY=           # optional
MOCK_LLM=0                  # set to 1 for offline demo
MOCK_TTS=0
MOCK_STT=0
SQLITE_PATH=data/interview_coach.db
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AI_CORE_URL=http://localhost:8001
NEXT_PUBLIC_WS_URL=ws://localhost:8001
```

**`ai-core/.env` (used by AI Core only):**
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_FAST_MODEL=gpt-4o-mini
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_MODEL_ID=eleven_turbo_v2_5
MOCK_LLM=0
MOCK_TTS=0
MOCK_STT=0
```

### Starting All Services

**Terminal 1 — Legacy Backend (:8000):**
```bash
cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000
```

**Terminal 2 — AI Core (:8001):**
```bash
cd ai-core && python -m uvicorn app.main:app --port 8001 --env-file .env
```

**Terminal 3 — Frontend (:3000):**
```bash
cd web && npm run dev
```

Open `http://localhost:3000/practice/setup` to start.

### Mock Mode (No API Keys)

```bash
# AI Core in full mock mode
cd ai-core && MOCK_LLM=1 MOCK_TTS=1 MOCK_STT=1 python -m uvicorn app.main:app --port 8001

# Legacy backend (set MOCK_LLM=1 in .env or env var)
cd backend && MOCK_LLM=1 uvicorn main:app --port 8000
```

---

## 5. Session Types (AI Core)

| Type | Duration | Phases | Description |
|------|----------|--------|-------------|
| `FULL_INTERVIEW` | 60 min | INTRODUCTION → RESUME_DEEP_DIVE → BEHAVIORAL → TECHNICAL_DISCUSSION → CODING_ROUND → CODING_FOLLOWUPS → FINAL_WRAP → REPORT_GENERATION | Complete mock interview |
| `BEHAVIORAL_PRACTICE` | 15 min | INTRODUCTION_OR_PROMPT → BEHAVIORAL_RESPONSE → FOLLOWUPS → FEEDBACK | STAR story practice |
| `TECHNICAL_CONCEPT_PRACTICE` | 20 min | CONCEPT_EXPLANATION → DEPTH_FOLLOWUPS → TRADEOFFS → FEEDBACK | Explain Redis, microservices, etc. |
| `CODING_PRACTICE` | 45 min | PROBLEM_STATEMENT → APPROACH_DISCUSSION → CODING → EDGE_CASES → COMPLEXITY → FEEDBACK | LeetCode-style round |
| `RESUME_DEEP_DIVE` | 30 min | INTRODUCTION → PROJECT_PROBE → OWNERSHIP_CHALLENGE → FEEDBACK | Probe resume projects |
| `CUSTOM_QUESTION` | 15 min | QUESTION_PROMPT → RESPONSE → FOLLOWUPS → FEEDBACK | Any custom topic |

---

## 6. API Reference

### AI Core (:8001)

**`POST /sessions/start`** — Create a session
```json
{
  "session_type": "BEHAVIORAL_PRACTICE",
  "duration_minutes": 15,
  "mode": "learning",
  "focus_area": "tell me about yourself",
  "context_file": "",
  "resume": "3 years at Shopify...",
  "job_description": "Senior SDE...",
  "company": "Google",
  "role_type": "SDE2",
  "difficulty": "medium"
}
```
Returns: `{ session_id, intro_message, session_type, mode, duration_minutes, phases[] }`

**`POST /sessions/{id}/text-test`** — Text-only turn (testing)
```json
{ "transcript": "I worked on payment microservices..." }
```
Returns: `{ session_id, interviewer_response, guardrail_activated, current_phase, is_session_complete }`

**`POST /sessions/{id}/end`** — End session, generate report
Returns: `EvaluationReport { session_id, overall_score, metric_scores[], strengths[], weaknesses[], action_plan[] }`

**`GET /sessions/{id}/status`** — Current session state
Returns: `{ session_type, mode, current_phase, current_phase_index, total_phases, time_remaining_seconds, turns_count, is_complete }`

**`POST /sessions/{id}/advance-phase`** — Manually advance phase

**`GET /health`** — `{ status, mock_llm, mock_tts, mock_stt }`

**`GET /session-types`** — List all supported session types

**`WebSocket /sessions/{id}/stream`** — Real-time voice interview (see section 7)

### Legacy Backend (:8000)

**`POST /api/sessions`** — Create legacy session (mode + persona_id)
**`GET /api/sessions`** — List sessions for dashboard
**`GET /api/sessions/{id}`** — Session metadata
**`POST /api/sessions/{id}/end`** — End session, generate TLDR
**`POST /api/sessions/{id}/finish`** — Generate structured RoleReady report
**`GET /api/sessions/{id}/report`** — Get report (structured or legacy)
**`GET /api/questions`** — List demo questions
**`GET /health`** — Health check

---

## 7. WebSocket Protocol (Voice Interview)

Connect to: `ws://localhost:8001/sessions/{session_id}/stream`

The session must be created first via `POST /sessions/start`.

### Client → Server Events

| Event | Payload | When |
|-------|---------|------|
| `speech_started` | `{}` | User taps mic button |
| `audio_chunk` | `{ data: base64 }` | Every 250ms while recording (MediaRecorder webm/opus) |
| `transcript_chunk` | `{ text, is_final }` | Partial transcript (if using browser STT) |
| `speech_ended` | `{ final_transcript }` | User taps stop — triggers full pipeline |
| `code_update` | `{ code, language }` | Code editor update (coding sessions) |
| `mode_update` | `{ mode }` | Switch learning/professional mid-session |
| `end_session` | `{}` | End session and generate report |

### Server → Client Events

| Event | Payload | When |
|-------|---------|------|
| `transcript_chunk` | `{ text, is_final }` | Server echoes STT result back |
| `interviewer_text_delta` | `{ delta, is_final }` | Streaming text tokens from OpenAI |
| `interviewer_audio_chunk` | `{ data: base64 }` | Streaming MP3 from ElevenLabs TTS |
| `selected_question` | `{ question, phase }` | Which follow-up was selected |
| `phase_update` | `{ phase, description, phase_index, total_phases }` | Phase transition |
| `timer_update` | `{ time_remaining_seconds, current_phase }` | Timer tick |
| `report_ready` | `{ session_id, report }` | Report generated (session complete) |
| `latency_metrics` | `{ speech_end_to_question_selected_ms, ... }` | Turn timing |
| `error` | `{ code, message }` | Error notification |

### Full Voice Turn Pipeline

```
1. Client sends speech_started
2. Client sends audio_chunk every 250ms (base64 webm/opus)
3. Server runs ElevenLabs STT on each chunk → sends transcript_chunk back
4. Server fires background question generation on partial transcript
5. Client sends speech_ended
6. Server: select_best_followup (fast gpt-4o-mini call)
7. Server: generate_response_stream (gpt-4o, streaming)
   → sends interviewer_text_delta for each token
8. Server: synthesize_stream (ElevenLabs TTS)
   → sends interviewer_audio_chunk for each MP3 chunk
9. Server: update_memory (add turns to session history)
10. Server: sends latency_metrics
```

---

## 8. AI Core Internal Architecture

### Turn Processing Pipeline

```
candidate speaks
    ↓
┌─ ghostwriting check (regex, no LLM) ─┐
│  detected? → refuse + coaching nudge  │
└───────────────────────────────────────┘
    ↓ (not ghostwriting)
┌─ question_generator (background) ─────┐
│  generates 3-5 candidate questions    │
│  using partial transcript + context   │
│  priority scored 0.0-1.0              │
└───────────────────────────────────────┘
    ↓
┌─ followup_selector (fast call) ───────┐
│  gpt-4o-mini picks best question      │
│  from pre-generated candidates        │
└───────────────────────────────────────┘
    ↓
┌─ response_generator (streaming) ──────┐
│  gpt-4o generates interviewer reply   │
│  uses: session context, phase,        │
│  candidate context, conversation      │
│  history, selected question           │
└───────────────────────────────────────┘
    ↓
┌─ memory (compaction) ─────────────────┐
│  add turns to history                 │
│  if > 16 turns: summarise older ones  │
│  keep last 8 verbatim                 │
└───────────────────────────────────────┘
```

### Session Planner

`core/session_planner.py` converts `(session_type, duration, mode, focus_area, context)` into a `SessionPlan`:
- Allocates time budgets per phase (percentage of total duration)
- Selects evaluation rubric per session type
- Generates question strategy based on mode + difficulty + context

### Context Loader

`core/context_loader.py` parses the upstream research context file (markdown with headings) into a `CandidateContext`:
- Extracts: candidate_summary, company_summary, role_expectations, likely_topics, resume_highlights, risk_areas, behavioral_themes, coding_patterns, reddit_insights
- Falls back to raw resume/JD parsing if no structured context file

### Ghostwriting Guardrail

Server-side regex check in `agents/response_generator.py`. Cannot be bypassed from the client. Patterns include:
- "just tell me what to say"
- "give me the answer"
- "write me a good answer"
- "what should I say"
- "how should I answer"
- "show me how to answer"

When triggered: returns a coaching refusal (mode-aware tone) instead of answering.

### Mock Mode

When `MOCK_LLM=1` or `OPENAI_API_KEY` is absent, `services/openai_service.py` returns deterministic mock responses. Mock responses are keyed by system prompt content (interviewer, question_generator, evaluator, etc.). TTS returns empty bytes. STT returns a placeholder transcript.

---

## 9. Frontend Architecture

### User Flow

```
/                          → redirects to /dashboard
/dashboard                 → session list + stats (server component)
/practice/setup            → session config form → POST /sessions/start
/practice/interview?...    → voice-first interview room (WebSocket)
/practice/report?session_id=... → structured evaluation report
```

### Voice-First Interview Room

`components/roleready/InterviewRoom.tsx` is the main interview UI:

- **VoiceOrb** (`VoiceOrb.tsx`): Canvas-animated blob in the center of the screen
  - `idle`: dim indigo, gentle breathe animation
  - `listening`: spiky violet, reacts to real-time mic volume (Web Audio API RMS)
  - `thinking`: slow amber morphing pulse
  - `speaking`: smooth teal/cyan rhythmic waves
- **useMicrophone** (`lib/useMicrophone.ts`): MediaRecorder captures mic → sends `audio_chunk` events over WebSocket every 250ms. Web Audio API analyser provides real-time volume for orb animation.
- **useInterviewSocket** (`lib/useInterviewSocket.ts`): Manages WebSocket connection, handles all server events, queues audio chunks for sequential playback via `new Audio()`.
- **Transcript drawer**: Slides up from bottom, shows full conversation history
- **Controls**: Big mic button (tap to start/stop), transcript toggle, end session button

### API Client

`lib/api.ts` exports a typed `api` object with two namespaces:
- `api.createSession()`, `api.listSessions()`, etc. → legacy backend (:8000)
- `api.aiCore.startSession()`, `api.aiCore.textTurn()`, etc. → AI Core (:8001)

### Design System

- Dark theme: `bg-gray-950` base, `bg-gray-900` surfaces, `border-gray-800`
- Primary accent: indigo-600 (buttons, active states)
- Status: green (success/closed), amber (partial/improved), red (weak/open)
- Cards: `rounded-2xl border border-gray-800 bg-gray-900/70 p-5`
- Buttons: `rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold`
- Typography: gray-100 primary, gray-400 secondary, gray-500 tertiary
- Labels: `text-xs font-semibold uppercase tracking-[0.2em] text-gray-500`

---

## 10. Database Schema (SQLite)

All tables are in `backend/db/schema.sql`. The legacy backend creates them on startup.

```sql
users           (id, email, display_name, created_at)
sessions        (id, user_id, mode, persona_id, state, current_question_idx,
                 questions_completed, target_role, company_name, interview_type,
                 readiness_score, summary, started_at, ended_at, tldr)
turns           (id, session_id, question_id, speaker, transcript,
                 classification, gap_addressed, probe_count, created_at)
gaps            (id, session_id, label, category, evidence, status, created_at)
reports         (id, session_id, summary, strengths_json, gaps_json,
                 scores_json, followup_json, next_steps_json, created_at)
research_cache  (id, company, role, search_category, results_json, created_at)
```

The AI Core does NOT use SQLite — it holds all session state in-process memory (`models/session.py: _sessions dict`). Sessions are lost on restart.

---

## 11. Prompt Files

### AI Core Prompts (`ai-core/prompts/`)

| File | Purpose | Used By |
|------|---------|---------|
| `interviewer.md` | Core interviewer behavior: one question at a time, concise, no ghostwriting, mode-aware | `response_generator.py`, `orchestrator.py` |
| `session_planner.md` | Generate session plan JSON from session_type + context | Not actively called (plans are built in code) |
| `question_generator.md` | Generate 3-5 follow-up questions with priority scores | `question_generator.py` |
| `followup_selector.md` | Select best question from candidates (fast call) | `followup_selector.py` |
| `evaluator.md` | General evaluation report with rubric scoring | `evaluator.py` |
| `coding_evaluator.md` | Coding-specific evaluation (approach, correctness, complexity) | `evaluator.py` |

### Legacy Prompts (`prompts/`)

| File | Purpose |
|------|---------|
| `classify_turn.md` | Classify candidate turn: complete/partial/clarify/stall |
| `generate_probe.md` | Generate follow-up probe targeting a specific gap |
| `generate_feedback.md` | Generate TLDR feedback summary |
| `scaffold_refusal.md` | Ghostwriting refusal rules (learning vs professional mode) |
| `report_generator.md` | Structured report generation with scores and gaps |

---

## 12. Evaluation Rubrics

Each session type has a specific rubric in `ai-core/app/core/session_planner.py`:

**FULL_INTERVIEW:** communication, technical_depth, problem_solving, coding_correctness, edge_cases, ownership, confidence, hire_signal

**BEHAVIORAL_PRACTICE:** structure, clarity, relevance, confidence, specificity, star_quality

**TECHNICAL_CONCEPT_PRACTICE:** conceptual_clarity, correctness, depth, examples, tradeoffs, communication

**CODING_PRACTICE:** approach, correctness, complexity, edge_cases, code_quality, debugging

**RESUME_DEEP_DIVE:** ownership, implementation_depth, metrics, tradeoffs, credibility, clarity

---

## 13. Research Agent (Tavily)

`backend/llm/tavilyresearch.py` searches for company-specific interview data:

- `search_company_question_types(company, role)` — what questions does this company ask?
- `search_company_interviewer_types(company, role)` — what's the interview process like?

Results are cached in `research_cache` table with a 7-day TTL. Stale cache is used as fallback if Tavily API fails.

CLI usage: `python -m backend.llm.tavilyresearch Google --role "software engineer" --json`

---

## 14. Key Design Decisions

1. **Two backends, not one.** The legacy backend owns persistence and was built by the full team. The AI Core was built as a standalone service for the interview engine. They coexist.

2. **In-process session state for AI Core.** No database — sessions live in a Python dict. Fast, simple, but lost on restart. Acceptable for hackathon MVP.

3. **OpenAI for AI Core, Groq for legacy.** The AI Core uses gpt-4o (reasoning) and gpt-4o-mini (fast classification). The legacy backend uses Groq's llama models. Both have mock mode fallbacks.

4. **Voice-first, text-fallback.** The primary UX is voice (mic → ElevenLabs STT → OpenAI → ElevenLabs TTS). The `/text-test` endpoint exists for testing without audio.

5. **Ghostwriting guardrail is server-side.** Regex check runs before any LLM call. Cannot be bypassed from the client. Non-negotiable product principle.

6. **One orchestrator, helper modules.** The AI Core uses one `InterviewOrchestrator` with helper agents (question_generator, followup_selector, response_generator, evaluator). Not a multi-agent swarm.

---

## 15. Known Limitations & TODOs

- **Phase auto-advancement:** Phases never auto-advance based on turn count or time. Currently manual only via `/advance-phase`.
- **Question deduplication:** The question generator doesn't filter out already-asked questions.
- **AI Core persistence:** Sessions are in-memory only. Server restart loses all active sessions.
- **ElevenLabs STT SDK:** The `speech_to_text.convert()` method signature may need adjustment based on SDK version.
- **WebSocket reconnection:** Frontend doesn't auto-reconnect on WS disconnect.
- **No auth:** Hardcoded `demo-user-001` everywhere.
- **Docker Compose:** Only covers legacy backend + frontend. AI Core not containerized yet.

---

## 16. Testing

```bash
# Legacy backend tests
cd backend && source .venv/bin/activate && pytest tests/ -v

# AI Core — syntax check all files
cd ai-core && python -m py_compile app/main.py app/core/orchestrator.py app/agents/response_generator.py

# Frontend — type check + build
cd web && npm run build

# Manual E2E test (AI Core)
curl -X POST http://localhost:8001/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"session_type":"BEHAVIORAL_PRACTICE","duration_minutes":15,"mode":"learning","focus_area":"tell me about yourself","company":"Google","role_type":"SDE2"}'

# Then use the session_id to submit turns:
curl -X POST http://localhost:8001/sessions/{SESSION_ID}/text-test \
  -H "Content-Type: application/json" \
  -d '{"transcript":"I am a software engineer with 3 years of experience at Shopify."}'
```
