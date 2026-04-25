# RoleReady AI — Run Guide

**Last Updated:** After Day 2 Complete (Frontend merged to main)  
**Current Branch:** `main`  
**Team Integration Status:** ✅ All modules integrated

---

## 📊 Integration Status

### Merged Branches
- ✅ **Frontend branch** — Merged to main (commit: 53ec8f2)
  - Varad's reporting components (Day 1 + Day 2)
  - Report generation endpoints
  - Dashboard stats
  - All 5 frontend components

- ✅ **Main branch** — Contains:
  - Shivam's interview orchestrator
  - Ishaq's gap tracking (gaps table)
  - Tavily research cache (researcher agent)
  - Base interview flow

### Database Schema
All team members' tables are integrated:
- ✅ `users` — Base user table
- ✅ `sessions` — Extended with RoleReady fields (target_role, readiness_score, etc.)
- ✅ `turns` — Interview turn history
- ✅ `gaps` — Ishaq's gap tracking
- ✅ `reports` — Varad's report storage
- ✅ `research_cache` — Tavily research cache

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- **Python 3.11+** (via conda)
- **Node.js 18+** and npm
- **Git** (to pull latest changes)

### 1. Pull Latest Changes
```bash
# Make sure you're on main branch
git checkout main
git pull origin main

# Verify you have the latest merge
git log --oneline -1
# Should show: "merge: frontend branch into main..."
```

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Activate conda environment (or create if needed)
conda activate interview-coach

# If environment doesn't exist, create it:
# conda create -n interview-coach python=3.11 -y
# conda activate interview-coach

# Install dependencies
pip install -r requirements.txt

# Create .env file (optional - works without API keys in mock mode)
cp ../.env.example .env

# Edit .env and set MOCK_LLM=1 for demo mode (no API keys needed)
# Or add your GROQ_API_KEY if you have one
```

### 3. Frontend Setup
```bash
# Navigate to frontend (from project root)
cd web

# Install dependencies
npm install
```

### 4. Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
conda activate interview-coach
MOCK_LLM=1 uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd web
npm run dev
```

**Terminal 3 — Open Browser:**
```bash
open http://localhost:3000
```

---

## 🎯 Full Setup Guide (First Time)

### Step 1: Environment Setup

#### Option A: Using Conda (Recommended)
```bash
# Check if conda is installed
conda --version

# Create environment
cd backend
conda create -n interview-coach python=3.11 -y

# Activate environment
conda activate interview-coach

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import fastapi; print('FastAPI:', fastapi.__version__)"
python -c "from llm.mock_responses import is_mock_mode; print('Mock mode:', is_mock_mode())"
```

#### Option B: Using venv
```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate  # On macOS/Linux
# .venv\Scripts\activate   # On Windows

pip install -r requirements.txt
```

### Step 2: Environment Variables

#### For Demo Mode (No API Keys Required)
```bash
# Create .env file
cat > .env << 'EOF'
# Mock mode - no API keys needed
MOCK_LLM=1
MOCK_ASR=1
MOCK_TTS=1

# Database
SQLITE_PATH=data/interview_coach.db

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
EOF
```

#### For Production Mode (With API Keys)
```bash
# Copy example and edit
cp .env.example .env

# Then edit .env and add your API keys:
# GROQ_API_KEY=your_groq_key_here
# TAVILY_API_KEY=your_tavily_key_here (optional)
# DEEPGRAM_API_KEY=your_deepgram_key_here (optional)
# ELEVENLABS_API_KEY=your_elevenlabs_key_here (optional)

# Or set mock mode to 0 to use real APIs
# MOCK_LLM=0
```

### Step 3: Frontend Setup
```bash
cd web

# Install dependencies
npm install

# Verify installation
npm run build

# Should output: "✓ Compiled successfully"
```

### Step 4: Database Initialization

The database is automatically initialized on first backend startup. No manual steps needed!

**What happens automatically:**
1. Creates `data/interview_coach.db` file
2. Runs `backend/db/schema.sql` to create tables
3. Seeds demo user (`demo-user-001`)
4. Adds RoleReady extensions (target_role, readiness_score, etc.)

**To verify database:**
```bash
cd backend
conda activate interview-coach

# Check database file exists
ls -lh data/interview_coach.db

# Verify tables (optional)
sqlite3 data/interview_coach.db ".tables"
# Should show: gaps  reports  research_cache  sessions  turns  users
```

---

## 🏃 Running the Application

### Development Mode (Recommended)

**Terminal 1 — Backend with Hot Reload:**
```bash
cd backend
conda activate interview-coach

# Mock mode (no API keys)
MOCK_LLM=1 uvicorn main:app --reload --port 8000

# Or with real Groq API
uvicorn main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Starting Interview Coach backend...
INFO:     Database ready
INFO:     Configs loaded
INFO:     Loaded 6 demo questions
INFO:     Prompts loaded
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Terminal 2 — Frontend with Hot Reload:**
```bash
cd web
npm run dev
```

**Expected output:**
```
  ▲ Next.js 14.2.35
  - Local:        http://localhost:3000
  - Network:      http://192.168.1.x:3000

 ✓ Ready in 2.3s
```

**Terminal 3 — Open Browser:**
```bash
# macOS
open http://localhost:3000

# Linux
xdg-open http://localhost:3000

# Windows
start http://localhost:3000
```

### Production Mode

**Backend:**
```bash
cd backend
conda activate interview-coach
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend:**
```bash
cd web
npm run build
npm run start
```

---

## 🧪 Testing the Integration

### 1. Health Check
```bash
# Backend health
curl http://localhost:8000/health
# Expected: {"status":"ok"}

# Frontend
curl http://localhost:3000
# Expected: HTML response
```

### 2. Test Mock Mode
```bash
# Test mock report generation
curl -X POST http://localhost:8000/api/sessions/test-session-id/finish
# Expected: 404 (session not found) - this is correct!

# Test session list
curl http://localhost:8000/api/sessions
# Expected: [] (empty array initially)
```

### 3. Test Frontend Components

**Navigate to:**
1. **Dashboard:** http://localhost:3000/dashboard
   - Should show empty state with "Start Your First Practice" CTA
   - Varad's DashboardStats component (when sessions exist)

2. **Interview Room:** http://localhost:3000/interview/new
   - Should show interview setup
   - Shivam's orchestrator integration

3. **Report Page:** http://localhost:3000/report/[sessionId]
   - Should show "Report not ready" for non-existent sessions
   - Varad's report components (ReportSummary, ScoreCard, etc.)

### 4. End-to-End Test (Manual)

**Full flow test:**
1. Go to http://localhost:3000
2. Click "Start Practice" or navigate to `/interview/new`
3. Start an interview session
4. Answer a few questions
5. Click "Finish Interview"
6. View generated report
7. Return to dashboard
8. Verify session appears in list with new fields (target_role, readiness_score, main_gap)

---

## 🔍 Verification Checklist

### Backend Verification
- [ ] Backend starts without errors
- [ ] Database file created at `backend/data/interview_coach.db`
- [ ] Health endpoint responds: `curl http://localhost:8000/health`
- [ ] Mock mode works: `MOCK_LLM=1` environment variable set
- [ ] All tables exist: `users`, `sessions`, `turns`, `gaps`, `reports`, `research_cache`

### Frontend Verification
- [ ] Frontend starts without errors
- [ ] No TypeScript errors: `npm run build` passes
- [ ] Dashboard page loads: http://localhost:3000/dashboard
- [ ] Report components render (check browser console for errors)
- [ ] API calls work (check Network tab in browser DevTools)

### Integration Verification
- [ ] Frontend can call backend APIs (CORS configured)
- [ ] Session list endpoint returns new fields (target_role, readiness_score, main_gap)
- [ ] Report generation endpoint works (`POST /api/sessions/{id}/finish`)
- [ ] Report retrieval endpoint works (`GET /api/sessions/{id}/report`)
- [ ] Dashboard shows sessions with new fields

---

## 🐛 Troubleshooting

### Backend Issues

**Issue: `ModuleNotFoundError: No module named 'fastapi'`**
```bash
# Solution: Install dependencies
cd backend
conda activate interview-coach
pip install -r requirements.txt
```

**Issue: `sqlite3.OperationalError: no such table: reports`**
```bash
# Solution: Delete database and restart (will recreate)
rm backend/data/interview_coach.db
# Restart backend - database will be recreated
```

**Issue: `RuntimeError: GROQ_API_KEY is not set`**
```bash
# Solution: Use mock mode
cd backend
echo "MOCK_LLM=1" >> .env
# Restart backend
```

**Issue: Port 8000 already in use**
```bash
# Solution: Kill existing process
lsof -ti:8000 | xargs kill -9
# Or use different port
uvicorn main:app --reload --port 8001
```

### Frontend Issues

**Issue: `Error: Cannot find module 'next'`**
```bash
# Solution: Install dependencies
cd web
npm install
```

**Issue: TypeScript errors on build**
```bash
# Solution: Check for type mismatches
cd web
npm run build

# If errors persist, check:
# 1. web/lib/types.ts has all required types
# 2. Components import types correctly
# 3. No duplicate type definitions
```

**Issue: `ECONNREFUSED` when calling backend**
```bash
# Solution: Verify backend is running
curl http://localhost:8000/health

# If not running, start backend first
cd backend
conda activate interview-coach
MOCK_LLM=1 uvicorn main:app --reload --port 8000
```

**Issue: Port 3000 already in use**
```bash
# Solution: Kill existing process
lsof -ti:3000 | xargs kill -9
# Or use different port
PORT=3001 npm run dev
```

### Integration Issues

**Issue: CORS errors in browser console**
```bash
# Solution: Verify CORS configuration in backend/main.py
# Should include: http://localhost:3000

# Check browser console for exact error
# Restart backend after any CORS changes
```

**Issue: API returns 404 for new endpoints**
```bash
# Solution: Verify you're on main branch with latest merge
git branch  # Should show: * main
git log --oneline -1  # Should show frontend merge commit

# If not, pull latest:
git checkout main
git pull origin main

# Restart backend
```

---

## 📁 Project Structure

```
roleready-ai/
├── backend/                    # FastAPI backend
│   ├── api/
│   │   └── sessions.py        # ✅ Varad's endpoints integrated
│   ├── db/
│   │   ├── schema.sql         # ✅ All tables (gaps, reports, research_cache)
│   │   ├── queries.py         # ✅ Varad's query functions
│   │   └── init.py            # ✅ Auto-migration for RoleReady fields
│   ├── llm/
│   │   ├── mock_responses.py  # ✅ Varad's mock report
│   │   └── prompts.py
│   ├── orchestrator/          # Shivam's module
│   ├── prompts/
│   │   └── report_generator.md  # ✅ Varad's prompt
│   ├── main.py                # Entry point
│   └── requirements.txt
│
├── web/                        # Next.js frontend
│   ├── app/
│   │   ├── dashboard/         # Dashboard page
│   │   ├── interview/         # Interview pages
│   │   ├── practice/          # Practice flow
│   │   └── report/            # Report pages
│   ├── components/
│   │   ├── roleready/         # ✅ Varad's 5 components
│   │   │   ├── ReportSummary.tsx
│   │   │   ├── ScoreCard.tsx
│   │   │   ├── FollowUpAnalysis.tsx
│   │   │   ├── NextPracticePlan.tsx
│   │   │   └── DashboardStats.tsx
│   │   ├── p2/                # Existing components
│   │   └── shared/            # Shared components
│   ├── lib/
│   │   └── types.ts           # ✅ Shared TypeScript types
│   └── package.json
│
├── database/                   # Database files
│   ├── migrations/
│   └── seed_data/
│
├── .kiro/                      # Kiro specs
│   ├── specs/
│   │   └── roleready-ai-mvp/
│   │       ├── AI_AGENT_HANDOFF.md
│   │       ├── DAY1_VERIFICATION_REPORT.md
│   │       ├── DAY2_VERIFICATION_REPORT.md
│   │       └── tasks-varad.md
│   └── steering/
│
└── RUN_GUIDE.md               # This file
```

---

## 🎯 What's Working (Integrated)

### Backend (All Merged)
- ✅ **Varad's Module:**
  - `POST /api/sessions/{id}/finish` — Report generation
  - `GET /api/sessions/{id}/report` — Report retrieval
  - `GET /api/sessions` — Session list with new fields
  - Mock mode support
  - Database queries (insert_report, get_report, get_sessions_list)

- ✅ **Shivam's Module:**
  - Interview orchestrator
  - Turn classification
  - Ghostwriting guardrail
  - Session state management

- ✅ **Ishaq's Module:**
  - Gap tracking (gaps table)
  - Gap status updates (open/improved/closed)

- ✅ **Shared:**
  - Database schema with all tables
  - Mock mode for demo
  - CORS configuration
  - Health check endpoint

### Frontend (All Merged)
- ✅ **Varad's Components:**
  - ReportSummary — Role, date, readiness score, summary
  - ScoreCard — 5 dimensions with color coding
  - FollowUpAnalysis — Follow-up questions with quality badges
  - NextPracticePlan — Ordered list with icons
  - DashboardStats — Total sessions, avg score, most common gap

- ✅ **Shared:**
  - TypeScript types in `web/lib/types.ts`
  - Dark theme design system
  - Responsive layouts
  - API integration

---

## 🚧 What's Not Yet Implemented

### Day 3 Tasks (Varad)
- [ ] Task 3.6 — Report page (`web/app/practice/report/page.tsx`)
- [ ] Task 3.8 — Dashboard updates (`web/app/dashboard/page.tsx`)
- [ ] Task 3.9 — Layout rebrand (`web/components/shared/Layout.tsx`)

### Day 4 Tasks (Varad)
- [ ] Task 3.10 — Landing page (optional)
- [ ] Task 3.11 — Eval cases
- [ ] Task 3.12 — Demo data

### Other Team Members
- Check with Ishaq and Shivam for their remaining tasks

---

## 📞 Team Coordination

### Current Status
- **Varad:** Day 2 complete (components), Day 3 in progress (pages)
- **Ishaq:** Gap tracking integrated, check for remaining tasks
- **Shivam:** Orchestrator integrated, check for remaining tasks

### Communication
- **Slack/Discord:** #roleready-mvp
- **Git Branches:**
  - `main` — Stable, integrated code
  - `frontend` — Varad's work (merged to main)
  - `ai-core` — AI orchestration work

### Before Merging
1. Pull latest main: `git pull origin main`
2. Test locally with both backend and frontend
3. Run TypeScript build: `cd web && npm run build`
4. Run backend tests: `cd backend && pytest`
5. Create PR with clear description
6. Tag team members for review

---

## 🎓 Quick Reference

### Common Commands

**Backend:**
```bash
# Start backend (mock mode)
cd backend && conda activate interview-coach && MOCK_LLM=1 uvicorn main:app --reload --port 8000

# Run tests
cd backend && conda activate interview-coach && pytest

# Check database
sqlite3 backend/data/interview_coach.db ".tables"
```

**Frontend:**
```bash
# Start frontend
cd web && npm run dev

# Build (type check)
cd web && npm run build

# Lint
cd web && npm run lint
```

**Git:**
```bash
# Pull latest
git checkout main && git pull origin main

# Check status
git status

# View recent commits
git log --oneline -10
```

---

## ✅ Success Criteria

You'll know everything is working when:

1. ✅ Backend starts without errors
2. ✅ Frontend starts without errors
3. ✅ Health check responds: `curl http://localhost:8000/health`
4. ✅ Dashboard loads: http://localhost:3000/dashboard
5. ✅ No console errors in browser DevTools
6. ✅ TypeScript build passes: `cd web && npm run build`
7. ✅ Mock mode works (no API keys needed)
8. ✅ All 5 report components render correctly

---

## 🆘 Getting Help

### Documentation
- **Architecture:** `.kiro/steering/architecture.md`
- **Product:** `.kiro/steering/product.md`
- **Tasks:** `.kiro/specs/roleready-ai-mvp/tasks-varad.md`
- **Handoff:** `.kiro/specs/roleready-ai-mvp/AI_AGENT_HANDOFF.md`

### Verification Reports
- **Day 1:** `.kiro/specs/roleready-ai-mvp/DAY1_VERIFICATION_REPORT.md`
- **Day 2:** `.kiro/specs/roleready-ai-mvp/DAY2_VERIFICATION_REPORT.md`

### Team
- **Slack/Discord:** #roleready-mvp
- **Ishaq:** Gap Engine, mock responses, DB schema
- **Shivam:** Interview Orchestrator, endpoint shapes
- **Varad:** Reporting, Dashboard, Components

---

**Last Updated:** After frontend merge to main  
**Next Steps:** Complete Day 3 (Pages & Integration)

**Happy coding! 🚀**
