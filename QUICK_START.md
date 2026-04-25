# RoleReady AI — Quick Start

**5-Minute Setup** | **No API Keys Required** | **Mock Mode Ready**

---

## ✅ Integration Status

**Current Branch:** `main`  
**Latest Merge:** Frontend branch merged (commit: 53ec8f2)  
**Status:** ✅ All modules integrated and working

### What's Integrated:
- ✅ Varad's reporting module (Day 1 + Day 2)
- ✅ Shivam's interview orchestrator
- ✅ Ishaq's gap tracking
- ✅ All database tables (users, sessions, turns, gaps, reports, research_cache)
- ✅ Mock mode for demo without API keys

---

## 🚀 Quick Start (3 Steps)

### 1. Backend Setup
```bash
cd backend

# Activate conda environment
conda activate interview-coach

# If environment doesn't exist:
# conda create -n interview-coach python=3.11 -y
# conda activate interview-coach
# pip install -r requirements.txt

# Start backend (mock mode - no API keys needed)
MOCK_LLM=1 uvicorn main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Starting Interview Coach backend...
INFO:     Database ready
INFO:     Configs loaded
INFO:     Loaded 6 demo questions
INFO:     Prompts loaded
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 2. Frontend Setup
```bash
# New terminal
cd web

# Install dependencies (first time only)
npm install

# Start frontend
npm run dev
```

**Expected output:**
```
  ▲ Next.js 14.2.35
  - Local:        http://localhost:3000

 ✓ Ready in 2.3s
```

### 3. Open Browser
```bash
open http://localhost:3000
```

**Pro Tip:** Click the **📝 Load Example** button on the setup page to auto-fill resume and job description for quick testing. See [`TESTING_GUIDE.md`](TESTING_GUIDE.md) for more testing scenarios.

---

## 🧪 Quick Test

### Health Check
```bash
curl http://localhost:8000/health
# Expected: {"status":"ok"}
```

### Test Endpoints
```bash
# Session list (should be empty initially)
curl http://localhost:8000/api/sessions
# Expected: []

# Questions list
curl http://localhost:8000/api/questions
# Expected: Array of questions
```

### Test Frontend
1. **Dashboard:** http://localhost:3000/dashboard
2. **Interview:** http://localhost:3000/interview/new
3. **Report:** http://localhost:3000/report/test-id (will show "not found" - expected)

---

## 📁 What's Working

### Backend Endpoints
- ✅ `GET /health` — Health check
- ✅ `GET /api/sessions` — List sessions (with new fields: target_role, readiness_score, main_gap)
- ✅ `POST /api/sessions` — Create session
- ✅ `GET /api/sessions/{id}` — Get session metadata
- ✅ `POST /api/sessions/{id}/finish` — Generate report (Varad's endpoint)
- ✅ `GET /api/sessions/{id}/report` — Get report (Varad's endpoint)
- ✅ `GET /api/questions` — List questions

### Frontend Components
- ✅ **ReportSummary** — Role, date, readiness score, summary
- ✅ **ScoreCard** — 5 dimensions with color coding (0-4 red, 5-7 amber, 8-10 green)
- ✅ **FollowUpAnalysis** — Follow-up questions with quality badges
- ✅ **NextPracticePlan** — Ordered list with icons (📚, 💻, 🗣)
- ✅ **DashboardStats** — Total sessions, avg score, most common gap

### Database Tables
- ✅ `users` — User accounts
- ✅ `sessions` — Interview sessions (with RoleReady fields)
- ✅ `turns` — Interview turn history
- ✅ `gaps` — Gap tracking (Ishaq's module)
- ✅ `reports` — Report storage (Varad's module)
- ✅ `research_cache` — Tavily research cache

---

## 🐛 Common Issues

### Backend won't start
```bash
# Check conda environment
conda activate interview-coach

# Reinstall dependencies
pip install -r requirements.txt

# Check port availability
lsof -ti:8000 | xargs kill -9
```

### Frontend won't start
```bash
# Reinstall dependencies
cd web
rm -rf node_modules package-lock.json
npm install

# Check port availability
lsof -ti:3000 | xargs kill -9
```

### Database errors
```bash
# Delete and recreate database
rm backend/data/interview_coach.db
# Restart backend - database will be recreated automatically
```

### CORS errors
```bash
# Verify backend is running on port 8000
curl http://localhost:8000/health

# Verify frontend is running on port 3000
curl http://localhost:3000

# Check browser console for exact error
```

---

## 📚 Full Documentation

- **Complete Setup:** See `RUN_GUIDE.md`
- **Architecture:** `.kiro/steering/architecture.md`
- **Tasks:** `.kiro/specs/roleready-ai-mvp/tasks-varad.md`
- **Verification:** `.kiro/specs/roleready-ai-mvp/DAY1_VERIFICATION_REPORT.md`

---

## 🎯 Next Steps

### For Varad (Day 3)
- [ ] Task 3.6 — Report page
- [ ] Task 3.8 — Dashboard updates
- [ ] Task 3.9 — Layout rebrand

### For Testing
1. Start both backend and frontend
2. Navigate to dashboard
3. Create a test session
4. Generate a report
5. Verify all components render correctly

---

## 📞 Team Coordination

**Slack/Discord:** #roleready-mvp

**Team Members:**
- **Ishaq:** Gap Engine, mock responses, DB schema
- **Shivam:** Interview Orchestrator, endpoint shapes
- **Varad:** Reporting, Dashboard, Components

**Git Workflow:**
```bash
# Pull latest
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature

# After work
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature

# Create PR on GitHub
```

---

**Last Updated:** After frontend merge to main  
**Status:** ✅ Ready for Day 3 development

**Happy coding! 🚀**
