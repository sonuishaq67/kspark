# AI Agent Handoff Document — RoleReady AI MVP

**Last Updated:** Day 0 Complete  
**Project Status:** Ready for Day 1 Implementation  
**Current Phase:** Backend Foundation (Phase 1)

---

## 🎯 Quick Context

**What is this project?**  
RoleReady AI is an adaptive interview practice platform that analyzes a candidate's resume against a job description, identifies skill gaps, and runs a personalized mock interview that probes those specific gaps. The AI refuses to ghostwrite answers and instead coaches the candidate to improve.

**Why this document?**  
This handoff document allows any AI agent to pick up work on this project without losing context. It provides the complete state of the project, what's been done, what's next, and where to find everything.

---

## 📊 Project Status Overview

### Completed Work
- ✅ **Repository cleanup** — Removed unused folders (services/, proto/, evals/)
- ✅ **Folder restructuring** — Renamed infra/ → database/, infra/seed/ → database/seed_data/
- ✅ **Team member rename** — Vard → Varad across all documentation
- ✅ **Architecture gap analysis** — Verified all components are assigned
- ✅ **Day 0 setup (Varad)** — Coordination docs, roadmap, types, environment setup

### Current State
- **Phase:** Day 0 Complete → Ready for Day 1
- **Next Work:** Varad's Backend Foundation (Tasks 3.1-3.5)
- **Blockers:** None (can start Task 3.1 independently)
- **Dependencies:** Ishaq creates `mock_responses.py` (Day 1), Shivam confirms endpoint shapes (Day 1)

### Team Division
| Team Member | Workstream | Status |
|-------------|-----------|--------|
| **Ishaq** | Gap Engine (Steps 1-3) | Not started |
| **Shivam** | Interview Orchestrator (Step 4) | Not started |
| **Varad** | Reporting & Dashboard (Step 5) | Day 0 complete, ready for Day 1 |

---

## 🗂️ Critical Files to Read First

### For Understanding the Project (Read in Order)
1. **`.kiro/steering/product.md`** — Product vision, principles, target user
2. **`.kiro/steering/architecture.md`** — Tech stack, module boundaries, data flow
3. **`.kiro/specs/roleready-ai-mvp/requirements.md`** — Functional requirements
4. **`.kiro/specs/roleready-ai-mvp/design.md`** — Technical design, component specs

### For Varad's Workstream (Current Focus)
5. **`.kiro/specs/roleready-ai-mvp/tasks-varad.md`** — Complete task list (12 tasks)
6. **`.kiro/specs/roleready-ai-mvp/VARAD_QUICK_START.md`** — Daily reference card
7. **`.kiro/specs/roleready-ai-mvp/VARAD_IMPLEMENTATION_ROADMAP.md`** — 3-4 day roadmap
8. **`.kiro/specs/roleready-ai-mvp/DAY0_COMPLETION_CHECKLIST.md`** — Day 0 status

### For Coordination
9. **`.kiro/specs/roleready-ai-mvp/COORDINATION_ISHAQ.md`** — Agreements with Ishaq
10. **`.kiro/specs/roleready-ai-mvp/COORDINATION_SHIVAM.md`** — Agreements with Shivam
11. **`.kiro/specs/roleready-ai-mvp/SHARED_TYPES_GUIDE.md`** — TypeScript types usage

### For Other Workstreams
12. **`.kiro/specs/roleready-ai-mvp/tasks-ishaq.md`** — Ishaq's task list
13. **`.kiro/specs/roleready-ai-mvp/tasks-shivam.md`** — Shivam's task list
14. **`.kiro/specs/roleready-ai-mvp/tasks.md`** — Master task index

---

## 🏗️ Architecture Quick Reference

### Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** FastAPI, Python 3.11+, aiosqlite
- **Database:** SQLite (file-based, zero infra)
- **LLM:** Groq API (llama-3.3-70b, llama-3.1-8b)
- **Deployment:** Docker Compose (2 containers)

### Module Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    RoleReady AI MVP                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Ishaq's    │  │   Shivam's   │  │   Varad's    │      │
│  │  Gap Engine  │→ │ Orchestrator │→ │  Reporting   │      │
│  │  (Steps 1-3) │  │   (Step 4)   │  │   (Step 5)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SQLite Database                          │  │
│  │  sessions | gaps | turns | reports | users           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow
1. **Setup (Ishaq):** User submits JD + Resume → Gap analysis → Store gaps
2. **Interview (Shivam):** User answers questions → Classify + probe → Update gaps
3. **Report (Varad):** User finishes → Generate report → Store + display

---

## 📋 Varad's Task Breakdown (Current Focus)

### Phase 1: Backend Foundation (Day 1) — 4-6 hours
- [ ] **Task 3.1** — Report generator prompt (`prompts/report_generator.md`)
- [ ] **Task 3.2** — Mock report response (`backend/llm/mock_responses.py`)
- [ ] **Task 3.5** — DB query helpers (`backend/db/queries.py`)
- [ ] **Task 3.3** — Report generation endpoint (`backend/api/sessions.py`)
- [ ] **Task 3.4** — Report retrieval endpoint (`backend/api/sessions.py`)

### Phase 2: Report Components (Day 2) — 4-5 hours
- [ ] **Task 3.7** — ReportSummary.tsx
- [ ] **Task 3.7** — ScoreCard.tsx
- [ ] **Task 3.7** — FollowUpAnalysis.tsx
- [ ] **Task 3.7** — NextPracticePlan.tsx
- [ ] **Task 3.8** — DashboardStats.tsx

### Phase 3: Pages & Integration (Day 3) — 4-5 hours
- [ ] **Task 3.6** — Report page (`web/app/practice/report/page.tsx`)
- [ ] **Task 3.8** — Dashboard updates (`web/app/dashboard/page.tsx`)
- [ ] **Task 3.9** — Layout rebrand (`web/components/shared/Layout.tsx`)

### Phase 4: Polish & Data (Day 4) — 2-3 hours
- [ ] **Task 3.10** — Landing page (optional)
- [ ] **Task 3.11** — Eval cases (`evals/golden_interview_cases.yaml`)
- [ ] **Task 3.12** — Demo data (`database/seed_data/demo_session.yaml`)

### Phase 5: Testing & Refinement — 2-3 hours
- [ ] End-to-end testing with `MOCK_LLM=1`
- [ ] Mobile responsive testing
- [ ] Error state testing
- [ ] Integration testing with other modules

---

## 🔑 Key Contracts & Agreements

### API Contract: FinishSessionResponse
```typescript
interface FinishSessionResponse {
  report_id: string
  session_id: string
  summary: string
  strengths: string[]
  gaps: GapReportItem[]
  scores: ReportScores
  follow_up_analysis: FollowUpAnalysisItem[]
  next_practice_plan: string[]
}

interface GapReportItem {
  label: string
  status: "open" | "improved" | "closed"
  evidence: string | null
}

interface ReportScores {
  role_alignment: number      // 0-10
  technical_clarity: number   // 0-10
  communication: number       // 0-10
  evidence_strength: number   // 0-10
  followup_recovery: number   // 0-10
}

interface FollowUpAnalysisItem {
  question: string
  reason: string
  candidate_response_quality: "strong" | "partial" | "weak"
}
```

### Database Schema: reports Table
```sql
CREATE TABLE IF NOT EXISTS reports (
    id              TEXT PRIMARY KEY,
    session_id      TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    summary         TEXT NOT NULL,
    strengths_json  TEXT NOT NULL,
    gaps_json       TEXT NOT NULL,
    scores_json     TEXT NOT NULL,
    followup_json   TEXT NOT NULL,
    next_steps_json TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Demo Scenario (Agreed with Ishaq)
- **Target Role:** Backend Engineer Intern
- **Company:** Acme Corp
- **Readiness Score:** 58 / 100
- **Strong Skills:** Python, REST APIs, Git, Team project
- **Partial Skills:** SQL, Authentication, Cloud basics
- **Missing Skills:** Database scaling, Production debugging, Metrics, System design trade-offs

### Color Coding (Design System)
- **Red (0-40):** `bg-red-100 text-red-800 border-red-300`
- **Amber (41-70):** `bg-amber-100 text-amber-800 border-amber-300`
- **Green (71-100):** `bg-green-100 text-green-800 border-green-300`

---

## 🚀 Quick Start Commands

### Environment Setup (First Time)
```bash
# Backend
cd backend
conda create -n roleready python=3.11 -y
conda activate roleready
pip install -r requirements.txt

# Frontend
cd web
npm install
```

### Development (Daily)
```bash
# Terminal 1: Backend
cd backend
conda activate roleready
MOCK_LLM=1 uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd web
npm run dev

# Browser
open http://localhost:3000
```

### Testing
```bash
# Backend tests
cd backend
conda activate roleready
pytest tests/test_report.py -v

# Frontend build (type checking)
cd web
npm run build
```

---

## 📁 File Structure Reference

### Varad's Files (What You'll Create/Modify)

#### Backend (5 files)
```
prompts/
  └── report_generator.md                    [NEW - Task 3.1]

backend/
  ├── llm/
  │   └── mock_responses.py                  [EXTEND - Task 3.2]
  ├── db/
  │   └── queries.py                         [EXTEND - Task 3.5]
  └── api/
      └── sessions.py                        [EXTEND - Tasks 3.3, 3.4]
```

#### Frontend (10 files)
```
web/
  ├── app/
  │   ├── page.tsx                           [MODIFY - Task 3.10]
  │   ├── dashboard/
  │   │   └── page.tsx                       [MODIFY - Task 3.8]
  │   └── practice/
  │       └── report/
  │           └── page.tsx                   [NEW - Task 3.6]
  └── components/
      ├── shared/
      │   └── Layout.tsx                     [MODIFY - Task 3.9]
      ├── p2/
      │   └── SessionCard.tsx                [MODIFY - Task 3.8]
      └── roleready/
          ├── ReportSummary.tsx              [NEW - Task 3.7]
          ├── ScoreCard.tsx                  [NEW - Task 3.7]
          ├── FollowUpAnalysis.tsx           [NEW - Task 3.7]
          ├── NextPracticePlan.tsx           [NEW - Task 3.7]
          └── DashboardStats.tsx             [NEW - Task 3.8]
```

#### Data (2 files)
```
evals/
  └── golden_interview_cases.yaml            [EXTEND - Task 3.11]

database/
  └── seed_data/
      └── demo_session.yaml                  [NEW - Task 3.12]
```

### Existing Code to Read
```
backend/
  ├── api/sessions.py          [Read to understand existing endpoints]
  ├── db/queries.py            [Read to understand query patterns]
  └── llm/client.py            [Read to understand LLM client]

web/
  ├── lib/types.ts             [Read for TypeScript types]
  ├── app/dashboard/page.tsx   [Read current dashboard]
  └── components/
      ├── shared/Layout.tsx    [Read current layout]
      └── p2/SessionCard.tsx   [Read current session card]
```

---

## 🎯 Core Principles (CRITICAL)

### 1. Coach, Don't Ghostwrite
**Never include model answers or "what you should have said" content in reports.**
- ✅ DO: "You mentioned the API but didn't address database scaling"
- ❌ DON'T: "You should have said: 'I would use sharding and read replicas...'"

### 2. Mock Mode First
**Build everything with `MOCK_LLM=1` before testing with real API.**
- All endpoints must work without `GROQ_API_KEY`
- Demo must be runnable without any API keys
- Mock responses in `backend/llm/mock_responses.py`

### 3. Idempotent Endpoints
**`POST /api/sessions/{id}/finish` must handle duplicate calls.**
- Check if report exists before generating
- Return existing report if already generated
- Don't create duplicate reports

### 4. Null Safety
**Not all sessions have new fields.**
- `target_role` may be null (old sessions)
- `readiness_score` may be null (old sessions)
- `main_gap` may be null (all gaps closed)
- Always handle null cases in UI

### 5. Color Coding Consistency
**Use Tailwind classes, not hardcoded colors.**
- 0-40: Red (`bg-red-100 text-red-800`)
- 41-70: Amber (`bg-amber-100 text-amber-800`)
- 71-100: Green (`bg-green-100 text-green-800`)

---

## 🔗 Dependencies & Coordination

### Depends on Ishaq
- **`backend/llm/mock_responses.py`** — Ishaq creates file, Varad extends with `MOCK_RESPONSES["report_generator"]`
- **Database migration** — Ishaq creates `002_roleready_extensions.sql` with `reports` table
- **Demo scenario data** — Agreed on Backend Engineer Intern scenario (see COORDINATION_ISHAQ.md)

### Depends on Shivam
- **`FinishSessionResponse` shape** — Agreed in COORDINATION_SHIVAM.md
- **`TurnResponse.updated_session_state`** — Structure confirmed
- **InterviewRoom "Finish" button** — Shivam implements, calls Varad's `/finish` endpoint

### Provides to Others
- **`POST /api/sessions/{id}/finish`** — Shivam's InterviewRoom calls this
- **`GET /api/sessions/{id}/report`** — Dashboard and report page use this
- **`web/lib/types.ts`** — All team members import types from here

---

## 🧪 Testing Strategy

### Unit Testing (Backend)
```bash
cd backend
conda activate roleready
pytest tests/test_report.py -v
```

Test cases:
- Report generation with mock mode
- Report retrieval (existing vs not found)
- Session list with new fields
- Idempotency of `/finish` endpoint
- Error handling (404, 422, 500)

### Integration Testing (Frontend)
```bash
cd web
npm run build  # Catches TypeScript errors
```

Test scenarios:
- Report page with existing report
- Report page with 404 (show generate button)
- Dashboard with sessions (show stats)
- Dashboard empty state (show CTA)
- Mobile responsive layout

### End-to-End Testing
1. Start backend with `MOCK_LLM=1`
2. Start frontend
3. Navigate to `/practice/setup`
4. Complete Steps 1-4 (Ishaq + Shivam's work)
5. Click "Finish Interview"
6. Verify report page renders correctly
7. Navigate to dashboard
8. Verify session shows with new fields

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Forgetting Mock Mode
**Problem:** Testing with real API keys, hitting rate limits  
**Solution:** Always set `MOCK_LLM=1` during development

### Pitfall 2: Hardcoding Colors
**Problem:** Inconsistent color scheme across components  
**Solution:** Use Tailwind classes from design system

### Pitfall 3: Skipping Null Checks
**Problem:** UI crashes on old sessions without new fields  
**Solution:** Use optional chaining and null coalescing

### Pitfall 4: Non-Idempotent Endpoints
**Problem:** Duplicate reports created on retry  
**Solution:** Check if report exists before generating

### Pitfall 5: Guessing Types
**Problem:** TypeScript errors, mismatched interfaces  
**Solution:** Import from `web/lib/types.ts`, don't redefine

### Pitfall 6: Ghostwriting in Reports
**Problem:** Including model answers violates core principle  
**Solution:** Focus on observations, not prescriptions

### Pitfall 7: Skipping Mobile Testing
**Problem:** UI breaks on mobile devices  
**Solution:** Test responsive layout at 375px, 768px, 1024px

---

## 📞 Coordination Checklist

### Before Starting Day 1
- [ ] Read all files in "Critical Files to Read First" section
- [ ] Verify conda environment is set up
- [ ] Verify frontend dependencies are installed
- [ ] Test that backend starts with `MOCK_LLM=1`
- [ ] Test that frontend starts and connects to backend

### Day 1 Morning (Coordination)
- [ ] **Ping Ishaq:** Confirm when `mock_responses.py` will be ready
- [ ] **Ping Ishaq:** Verify demo scenario data matches
- [ ] **Ping Ishaq:** Confirm `reports` table schema in migration
- [ ] **Ping Shivam:** Confirm `FinishSessionResponse` shape
- [ ] **Ping Shivam:** Agree on error handling protocols

### After Each Task
- [ ] Test the task incrementally
- [ ] Commit with clear message (e.g., "feat: add report generator prompt")
- [ ] Update task checklist in `tasks-varad.md`
- [ ] Document any blockers or questions

### End of Day 1
- [ ] All 5 backend tasks complete
- [ ] `/finish` endpoint works with mock mode
- [ ] `/report` endpoint returns stored report
- [ ] Session list includes new fields
- [ ] Push all commits

---

## 🎓 Learning Resources

### FastAPI Patterns
- Read `backend/api/sessions.py` for existing endpoint patterns
- Read `backend/db/queries.py` for async query patterns
- Use `aiosqlite` with parameterized queries (SQL injection safety)

### Next.js Patterns
- Read `web/app/dashboard/page.tsx` for client component patterns
- Read `web/components/p2/SessionCard.tsx` for component structure
- Use `'use client'` directive for interactive components

### Tailwind Patterns
- Read existing components for class naming conventions
- Use responsive classes: `sm:`, `md:`, `lg:`
- Use spacing scale: `p-4`, `m-6`, `gap-3`

---

## 📊 Progress Tracking

### Day 0: Setup & Coordination ✅
- [x] Repository cleanup
- [x] Folder restructuring
- [x] Team member rename
- [x] Architecture gap analysis
- [x] Coordination documents
- [x] Implementation roadmap
- [x] Shared types file
- [x] Environment setup

### Day 1: Backend Foundation (Next)
- [ ] Task 3.1 — Report generator prompt
- [ ] Task 3.2 — Mock report response
- [ ] Task 3.5 — DB query helpers
- [ ] Task 3.3 — Report generation endpoint
- [ ] Task 3.4 — Report retrieval endpoint

### Day 2: Report Components
- [ ] Task 3.7 — All 4 report components
- [ ] Task 3.8 — DashboardStats component

### Day 3: Pages & Integration
- [ ] Task 3.6 — Report page
- [ ] Task 3.8 — Dashboard updates
- [ ] Task 3.9 — Layout rebrand

### Day 4: Polish & Data
- [ ] Task 3.10 — Landing page (optional)
- [ ] Task 3.11 — Eval cases
- [ ] Task 3.12 — Demo data

---

## 🎯 Definition of Done

### Backend Complete When:
- [ ] `POST /api/sessions/{id}/finish` returns full report JSON
- [ ] `GET /api/sessions/{id}/report` returns stored report or 404
- [ ] `GET /api/sessions` list includes `target_role`, `readiness_score`, `main_gap`
- [ ] All endpoints work with `MOCK_LLM=1`
- [ ] Idempotency verified (calling `/finish` twice returns same report)
- [ ] Error handling tested (404, 422, 500)

### Frontend Complete When:
- [ ] Report page renders all sections (summary, scores, strengths, gaps, follow-ups, next steps)
- [ ] Score cards show correct color coding (red/amber/green)
- [ ] Dashboard shows "RoleReady AI" branding
- [ ] Dashboard `SessionCard` shows new fields
- [ ] `DashboardStats` shows total sessions, avg score, most common gap
- [ ] Empty dashboard state shows RoleReady AI CTA
- [ ] Mobile responsive (tested at 375px, 768px, 1024px)

### Integration Complete When:
- [ ] End-to-end flow works with `MOCK_LLM=1`
- [ ] Report generation triggered from InterviewRoom
- [ ] Report displays correctly after generation
- [ ] Dashboard shows completed sessions with new fields
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] No console errors in browser

---

## 🔄 Handoff Protocol

### When Handing Off to Another Agent
1. **Update this document** with current progress
2. **Update task checklists** in `tasks-varad.md`
3. **Document blockers** in a new section below
4. **Commit all work** with clear messages
5. **List next immediate actions** for the next agent

### When Picking Up from Another Agent
1. **Read this document** completely (15-20 min)
2. **Read critical files** in order listed above
3. **Verify environment** setup works
4. **Check task checklists** for current status
5. **Review recent commits** to understand latest changes
6. **Start with next unchecked task** in current phase

---

## 📝 Current Blockers & Notes

### Blockers
- None currently (Day 0 complete, ready for Day 1)

### Notes
- `backend/llm/mock_responses.py` does NOT exist yet (Ishaq creates it)
- Varad can start Task 3.1 (report prompt) independently
- Task 3.2 (mock response) requires coordination with Ishaq
- All other tasks can proceed after Task 3.2

### Questions for Team
- None currently (coordination docs have all agreements)

---

## 🚀 Next Immediate Actions

### For Next Agent (Day 1 Start)
1. **Read this handoff document** (you're doing it now! ✅)
2. **Set up conda environment** if not already done
3. **Start Task 3.1** — Create `prompts/report_generator.md`
4. **Coordinate with Ishaq** — Confirm when `mock_responses.py` will be ready
5. **Continue with Task 3.2** — Add mock report response (after Ishaq creates file)

### Estimated Time
- Task 3.1: 30 minutes
- Task 3.2: 20 minutes (after Ishaq creates file)
- Task 3.5: 45 minutes
- Task 3.3: 90 minutes
- Task 3.4: 45 minutes
- **Total Day 1:** 4-6 hours

---

## 📚 Additional Resources

### Documentation Files
- `README.md` — Project overview, setup instructions
- `DEMO_SCRIPT.md` — Demo flow walkthrough
- `.kiro/specs/roleready-ai-mvp/DAY0_SUMMARY.md` — Day 0 accomplishments

### Configuration Files
- `.env.example` — Environment variables template
- `docker-compose.yml` — Container orchestration
- `Makefile` — Common commands

### Database Files
- `backend/db/schema.sql` — Database schema
- `database/migrations/001_demo_minimal.sql` — Initial migration
- `database/seed_data/demo_questions.yaml` — Demo questions

---

## ✅ Handoff Checklist

### Before Handing Off
- [x] All Day 0 tasks completed
- [x] Coordination documents created
- [x] Implementation roadmap created
- [x] Shared types file created
- [x] Environment setup documented
- [x] This handoff document created
- [x] All work committed and pushed

### For Next Agent
- [ ] Read this handoff document
- [ ] Verify environment setup
- [ ] Read critical files (1-11 in list above)
- [ ] Start Task 3.1

---

**Last Updated:** Day 0 Complete  
**Next Agent:** Start with Task 3.1 (Report Generator Prompt)  
**Estimated Time to Productivity:** 20-30 minutes (reading + setup verification)

**Good luck! You've got everything you need to succeed. 🚀**
