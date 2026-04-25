# Getting Started with RoleReady AI Development

**Quick Start Guide for Developers**

---

## 🎯 What You Need to Know

The RoleReady AI project has:
- ✅ **AI Core microservice** — Fully operational with 6 session types and voice interviews
- ✅ **Legacy backend** — Fully operational with database, session management, and gap tracking
- ✅ **Frontend** — Fully operational with dashboard, interview rooms, and reports
- 🚧 **RoleReady MVP spec** — Planned features for gap analysis and adaptive interviews (not yet implemented)

---

## 📚 Read These Files First

### 1. Start Here: Implementation Status
**File:** `.kiro/specs/roleready-ai-mvp/IMPLEMENTATION_STATUS.md`

This file shows you:
- What's already built (✅)
- What's planned but not implemented (🚧)
- File mapping (spec vs. actual code)
- Development priorities

**Read this first!** It will save you hours of confusion.

### 2. Then: Architecture Overview
**File:** `.kiro/steering/architecture.md`

This file explains:
- Dual-backend architecture (Legacy :8000 + AI Core :8001)
- Tech stack and design decisions
- Module boundaries
- Performance targets

### 3. Then: Product Vision
**File:** `.kiro/steering/product.md`

This file defines:
- Product principles (coach, don't ghostwrite)
- Target users
- Current features vs. planned features
- Out of scope items

### 4. If Implementing the Spec: Requirements & Design
**Files:**
- `.kiro/specs/roleready-ai-mvp/requirements.md` — Detailed requirements
- `.kiro/specs/roleready-ai-mvp/design.md` — Technical design
- `.kiro/specs/roleready-ai-mvp/tasks.md` — Task breakdown by person

---

## 🚀 Quick Start: Running the Project

### Prerequisites
- Python 3.11+ (conda recommended)
- Node.js 18+
- Git

### 1. Clone and Setup
```bash
git clone <repo-url>
cd interview-coach

# Backend setup
cd backend
conda create -n interview-coach python=3.11 -y
conda activate interview-coach
pip install -r requirements.txt

# Frontend setup
cd ../web
npm install

# AI Core setup (optional)
cd ../ai-core
pip install -r requirements.txt
```

### 2. Run in Mock Mode (No API Keys)
```bash
# Terminal 1: Legacy Backend
cd backend
conda activate interview-coach
MOCK_LLM=1 uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd web
npm run dev

# Terminal 3: AI Core (optional)
cd ai-core
MOCK_LLM=1 MOCK_TTS=1 MOCK_STT=1 python -m uvicorn app.main:app --port 8001
```

### 3. Open Browser
```bash
open http://localhost:3000
```

**See:** `QUICK_START.md` and `RUN_GUIDE.md` for detailed setup instructions.

---

## 🛠️ Development Paths

### Path A: Explore Existing Features

**What's already working:**
1. Dashboard with session list
2. Voice-first interviews (AI Core)
3. Text-based interviews (Legacy)
4. Evaluation reports
5. Live code review (partial)

**Try this:**
1. Start both backends + frontend
2. Go to `/practice/setup`
3. Create a BEHAVIORAL_PRACTICE session
4. Try the voice interview
5. View the evaluation report

### Path B: Implement RoleReady MVP Spec

**What you'll build:**
1. Gap analysis from JD + resume
2. Visual gap map
3. Adaptive interview targeting gaps
4. Structured reports with gap tracking

**Start here:**
1. Read `IMPLEMENTATION_STATUS.md` (Phase 1-6)
2. Choose your workstream:
   - **Ishaq:** Gap analysis engine + frontend
   - **Shivam:** Adaptive interview loop
   - **Varad:** Reports & dashboard
3. Open your task file:
   - `.kiro/specs/roleready-ai-mvp/tasks-ishaq.md`
   - `.kiro/specs/roleready-ai-mvp/tasks-shivam.md`
   - `.kiro/specs/roleready-ai-mvp/tasks-varad.md`
4. Start with Task 1.1, 2.1, or 3.1

### Path C: Enhance AI Core

**What you could add:**
1. More session types
2. Better evaluation rubrics
3. Improved voice quality
4. Session persistence (add SQLite to AI Core)
5. Advanced coding features

**Start here:**
1. Read `ai-core/README.md`
2. Explore `ai-core/app/` structure
3. Check `ai-core/prompts/` for prompt templates
4. Review `ai-core/app/core/session_planner.py` for session types

---

## 📂 Codebase Structure

### Backend (Legacy :8000)
```
backend/
├── api/sessions.py          # REST endpoints
├── db/
│   ├── schema.sql           # Database schema (all tables)
│   └── queries.py           # Async query functions
├── llm/
│   ├── client.py            # Groq LLM wrapper
│   ├── prompts.py           # Prompt loader
│   └── mock_responses.py    # Mock mode responses
├── orchestrator/
│   ├── session_manager.py   # Session lifecycle
│   ├── sub_agent.py         # Turn processing
│   └── state.py             # Session state
└── tests/                   # pytest tests
```

### AI Core (:8001)
```
ai-core/app/
├── main.py                  # FastAPI entry
├── api/
│   ├── sessions.py          # REST endpoints
│   └── websocket.py         # WebSocket handler
├── core/
│   ├── orchestrator.py      # Central coordinator
│   ├── session_planner.py   # Session type logic
│   └── memory.py            # Turn compaction
├── agents/
│   ├── question_generator.py
│   ├── followup_selector.py
│   ├── response_generator.py
│   └── evaluator.py
├── models/
│   ├── session.py           # Session state (in-memory)
│   └── evaluation.py        # Report models
└── services/
    ├── openai_service.py    # OpenAI wrapper
    ├── tts_service.py       # ElevenLabs TTS
    └── stt_service.py       # ElevenLabs STT
```

### Frontend (:3000)
```
web/
├── app/
│   ├── dashboard/page.tsx
│   ├── practice/
│   │   ├── setup/page.tsx
│   │   ├── interview/page.tsx
│   │   └── report/page.tsx
│   └── interview/           # Legacy flow
├── components/
│   ├── roleready/           # New components
│   ├── p2/                  # Legacy components
│   └── shared/              # Shared components
└── lib/
    ├── api.ts               # API client (dual-backend)
    ├── types.ts             # TypeScript types
    └── useMicrophone.ts     # WebSocket hooks
```

---

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
conda activate interview-coach
pytest tests/ -v
```

### Run Frontend Build
```bash
cd web
npm run build
```

### Manual E2E Test
1. Start all services
2. Create a session
3. Complete an interview
4. View the report
5. Check dashboard

---

## 📖 Key Concepts

### Dual-Backend Architecture
- **Legacy Backend (:8000)** — Database, session CRUD, gap tracking
- **AI Core (:8001)** — Advanced orchestration, voice interviews, evaluation
- **Frontend (:3000)** — Talks to both backends

### Session Types (AI Core)
- FULL_INTERVIEW (60 min)
- BEHAVIORAL_PRACTICE (15 min)
- TECHNICAL_CONCEPT_PRACTICE (20 min)
- CODING_PRACTICE (45 min)
- RESUME_DEEP_DIVE (30 min)
- CUSTOM_QUESTION (15 min)

### Mock Mode
- Set `MOCK_LLM=1` to run without API keys
- Returns deterministic responses
- Full flow works offline

### Ghostwriting Guardrail
- Server-side regex check
- Refuses to write answers for candidates
- Mode-aware (learning vs. professional)

---

## 🎓 Learning Resources

### Understanding the Codebase
1. Read `PROJECT.md` — Complete project reference
2. Read `README.md` — Project overview
3. Explore `backend/main.py` — Backend entry point
4. Explore `ai-core/app/main.py` — AI Core entry point
5. Explore `web/app/page.tsx` — Frontend entry point

### Understanding the Spec
1. Read `IMPLEMENTATION_STATUS.md` — What's built vs. planned
2. Read `requirements.md` — Detailed requirements
3. Read `design.md` — Technical design
4. Read `tasks.md` — Task breakdown

### Understanding the Architecture
1. Read `architecture.md` — Tech stack and design decisions
2. Read `product.md` — Product vision and principles
3. Check `ai microservice.md` — AI Core documentation

---

## 🤝 Team Coordination

### Workstream Ownership (If Implementing Spec)
- **Ishaq:** Gap analysis engine + gap map frontend
- **Shivam:** Adaptive interview loop + three-panel UI
- **Varad:** Reports + dashboard + layout rebrand

### API Contracts
- **Ishaq → Shivam:** ReadinessAnalysisResponse
- **Shivam → Varad:** TurnResponse + session turns
- **Ishaq owns migrations:** All DB schema changes

### Sync Points
1. Day 1: Agree on API shapes
2. After Ishaq Task 1.3: DB migration live
3. After Shivam Task 2.4: /finish endpoint live
4. Final: Integration smoke test

---

## ❓ Common Questions

### Q: Which backend should I use?
**A:** Depends on what you're building:
- Database operations → Legacy Backend (:8000)
- Voice interviews → AI Core (:8001)
- New gap analysis features → Legacy Backend (:8000)

### Q: Where do I add new endpoints?
**A:** 
- Legacy: `backend/api/sessions.py`
- AI Core: `ai-core/app/api/sessions.py`

### Q: How do I add a new prompt?
**A:**
- Legacy: Create `prompts/your_prompt.md`
- AI Core: Create `ai-core/prompts/your_prompt.md`

### Q: How do I test without API keys?
**A:** Set `MOCK_LLM=1` environment variable

### Q: Where are the database tables?
**A:** `backend/db/schema.sql` (all tables defined here)

### Q: How do I add a new component?
**A:** Create in `web/components/roleready/YourComponent.tsx`

---

## 🚦 Next Steps

### If You're New to the Project
1. ✅ Read this file (you're here!)
2. ✅ Read `IMPLEMENTATION_STATUS.md`
3. ✅ Run the project in mock mode
4. ✅ Explore the dashboard and interview flows
5. ✅ Read `architecture.md` and `product.md`
6. ✅ Decide: explore existing features or implement spec?

### If Implementing the Spec
1. ✅ Read `requirements.md` and `design.md`
2. ✅ Choose your workstream (Ishaq/Shivam/Varad)
3. ✅ Open your task file
4. ✅ Start with Task X.1
5. ✅ Follow the development priorities in `IMPLEMENTATION_STATUS.md`

### If Enhancing Existing Features
1. ✅ Explore the AI Core codebase
2. ✅ Read `ai-core/README.md`
3. ✅ Check existing session types
4. ✅ Identify enhancement opportunities
5. ✅ Discuss with team

---

## 📞 Getting Help

### Documentation
- `IMPLEMENTATION_STATUS.md` — What's built vs. planned
- `SPEC_REVIEW_SUMMARY.md` — Review summary
- `PROJECT.md` — Complete project reference
- `README.md` — Project overview
- `QUICK_START.md` — 5-minute setup
- `RUN_GUIDE.md` — Comprehensive run guide

### Team
- **Slack/Discord:** #roleready-mvp
- **Ishaq:** Gap Engine, mock responses, DB schema
- **Shivam:** Interview Orchestrator, endpoint shapes
- **Varad:** Reporting, Dashboard, Components

---

**Ready to start?** Open `IMPLEMENTATION_STATUS.md` and choose your path! 🚀
