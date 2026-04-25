# Varad's Quick Start Guide 🚀

**Use this as your daily reference card**

---

## 🏃 Quick Commands

### Start Development
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

### Run Tests
```bash
# Backend tests
cd backend
conda activate roleready
pytest tests/test_report.py -v

# Frontend build (catches type errors)
cd web
npm run build
```

---

## 📁 Your Files

### Backend (5 files)
1. `prompts/report_generator.md` — NEW
2. `backend/llm/mock_responses.py` — EXTEND (Ishaq creates)
3. `backend/db/queries.py` — EXTEND
4. `backend/api/sessions.py` — EXTEND

### Frontend (10 files)
5. `web/components/roleready/ReportSummary.tsx` — NEW
6. `web/components/roleready/ScoreCard.tsx` — NEW
7. `web/components/roleready/FollowUpAnalysis.tsx` — NEW
8. `web/components/roleready/NextPracticePlan.tsx` — NEW
9. `web/components/roleready/DashboardStats.tsx` — NEW
10. `web/app/practice/report/page.tsx` — NEW
11. `web/app/dashboard/page.tsx` — MODIFY
12. `web/components/p2/SessionCard.tsx` — MODIFY
13. `web/components/shared/Layout.tsx` — MODIFY
14. `web/app/page.tsx` — MODIFY (optional)

### Data (2 files)
15. `evals/golden_interview_cases.yaml` — EXTEND
16. `database/seed_data/demo_session.yaml` — NEW

---

## 🎯 Your 3 Endpoints

### 1. `POST /api/sessions/{id}/finish`
**You implement this**
- Generates report from session turns
- Returns `FinishSessionResponse`
- Errors: 404, 422, 500
- Must be idempotent

### 2. `GET /api/sessions/{id}/report`
**You extend this**
- Returns stored report or 404
- Includes metadata (created_at, target_role, etc.)

### 3. `GET /api/sessions`
**You extend this**
- Add: `target_role`, `readiness_score`, `main_gap`

---

## 📊 Your 5 Score Dimensions

1. **role_alignment** (0-10) — How well answers matched target role
2. **technical_clarity** (0-10) — Depth and accuracy of explanations
3. **communication** (0-10) — Structure, clarity, conciseness
4. **evidence_strength** (0-10) — Use of specific examples and metrics
5. **followup_recovery** (0-10) — How well candidate improved after probes

**Color coding:**
- 0-4: Red
- 5-7: Amber
- 8-10: Green

---

## 🎨 Quick Design Reference

### Tailwind Classes
```typescript
// Red (0-40)
className="bg-red-100 text-red-800 border-red-300"

// Amber (41-70)
className="bg-amber-100 text-amber-800 border-amber-300"

// Green (71-100)
className="bg-green-100 text-green-800 border-green-300"

// Card
className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"

// Badge
className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
```

---

## 🔗 Import Types

```typescript
import { 
  FinishSessionResponse,
  GapReportItem,
  ReportScores,
  FollowUpAnalysisItem,
  SessionListItem
} from '@/lib/types';
```

---

## 📋 Daily Checklist

### Day 1: Backend
- [ ] Task 3.1 — Report prompt
- [ ] Task 3.2 — Mock response
- [ ] Task 3.5 — DB queries
- [ ] Task 3.3 — `/finish` endpoint
- [ ] Task 3.4 — `/report` endpoint

### Day 2: Components
- [ ] Task 3.7 — ReportSummary
- [ ] Task 3.7 — ScoreCard
- [ ] Task 3.7 — FollowUpAnalysis
- [ ] Task 3.7 — NextPracticePlan
- [ ] Task 3.8 — DashboardStats

### Day 3: Pages
- [ ] Task 3.6 — Report page
- [ ] Task 3.8 — Dashboard updates
- [ ] Task 3.9 — Layout rebrand

### Day 4: Polish
- [ ] Task 3.10 — Landing (optional)
- [ ] Task 3.11 — Eval cases
- [ ] Task 3.12 — Demo data
- [ ] End-to-end testing

---

## 🚨 Common Pitfalls

1. ❌ Don't ghostwrite — Never include model answers
2. ❌ Don't forget null checks — Not all sessions have new fields
3. ❌ Don't skip idempotency — `/finish` must handle duplicate calls
4. ❌ Don't hardcode colors — Use Tailwind classes
5. ❌ Don't skip mock mode — Test with `MOCK_LLM=1` first
6. ❌ Don't forget error states — Handle 404, loading, empty
7. ❌ Don't skip mobile — Test responsive layout
8. ❌ Don't guess types — Use `web/lib/types.ts`

---

## 💡 Pro Tips

1. ✅ Start with mock mode — Build with `MOCK_LLM=1`
2. ✅ Test incrementally — Test each component as you build
3. ✅ Use existing patterns — Follow `backend/db/queries.py` style
4. ✅ Coordinate early — Sync with Ishaq and Shivam on Day 1
5. ✅ Mobile first — Design for mobile, scale up
6. ✅ Console logs — Use them liberally during development
7. ✅ Git commits — Commit after each task
8. ✅ Read coordination docs — They have all the agreements

---

## 📞 Quick Contacts

**Slack/Discord:** #roleready-mvp

**Ishaq:** Mock responses, DB schema, demo data  
**Shivam:** Endpoint shapes, session state, finish button

---

## 🎯 Definition of Done

- [ ] `POST /api/sessions/{id}/finish` works
- [ ] `GET /api/sessions/{id}/report` works
- [ ] Report page renders all sections
- [ ] Dashboard shows "RoleReady AI"
- [ ] Score cards show correct colors
- [ ] `MOCK_LLM=1` runs full flow
- [ ] 5 eval cases added
- [ ] End-to-end tested

---

## 📚 Full Documentation

- **Roadmap:** `VARAD_IMPLEMENTATION_ROADMAP.md`
- **Coordination:** `COORDINATION_ISHAQ.md`, `COORDINATION_SHIVAM.md`
- **Types:** `SHARED_TYPES_GUIDE.md`
- **Checklist:** `DAY0_COMPLETION_CHECKLIST.md`
- **Summary:** `DAY0_SUMMARY.md`
- **Tasks:** `tasks-varad.md`

---

**Remember:** Coach, don't ghostwrite. 🚀
