# RoleReady AI MVP — Quick Reference Card

**For Developers:** Print this or keep it open while coding

---

## 📋 What We're Building

**Goal:** Add gap analysis and adaptive interviews to the existing AI Core

**Timeline:** 2-3 weeks (3 developers in parallel)

**Workstreams:**
1. **Ishaq:** Gap analysis engine + gap map UI
2. **Shivam:** Adaptive interview loop + three-panel UI
3. **Varad:** Structured reports + dashboard enhancements

---

## 🎯 Phase Summary

| Phase | Owner | Days | Key Deliverable |
|-------|-------|------|-----------------|
| 1 | Ishaq | 3 | `POST /api/readiness/analyze` endpoint |
| 2 | Ishaq | 2 | Gap map frontend (3 columns) |
| 3 | Shivam | 3 | `POST /api/sessions/{id}/turns` endpoint |
| 4 | Shivam | 2 | Three-panel InterviewRoom UI |
| 5 | Varad | 3 | `POST /api/sessions/{id}/finish` endpoint |
| 6 | All | 2 | Testing & polish |

---

## 🔗 API Contracts

### Ishaq → Shivam

**ReadinessAnalysisResponse:**
```typescript
{
  session_id: string
  readiness_score: number  // 0-100
  summary: string
  strong_matches: SkillItem[]
  partial_matches: SkillItem[]
  missing_or_weak: SkillItem[]
  interview_focus_areas: string[]
  prep_brief: string[]
}
```

### Shivam → Varad

**TurnResponse:**
```typescript
{
  turn_id: string
  classification: string
  ai_response: string
  detected_strengths: string[]
  missing_gap: string | null
  follow_up_reason: string | null
  guardrail_activated: boolean
  updated_session_state: SessionStateSnapshot
}
```

---

## 📁 Files to Create

### Backend
- [ ] `backend/api/readiness.py`
- [ ] `prompts/readiness_analysis.md`
- [ ] `prompts/turn_classifier.md`
- [ ] `prompts/followup_generator.md`
- [ ] `prompts/guardrail.md`

### Frontend
- [ ] `web/components/roleready/InputPanel.tsx`
- [ ] `web/components/roleready/ReadinessScoreCard.tsx`
- [ ] `web/components/roleready/SkillGapMap.tsx`
- [ ] `web/components/roleready/PrepBriefCard.tsx`
- [ ] `web/app/practice/gap-map/page.tsx`
- [ ] `web/app/practice/prep-brief/page.tsx`

### Tests
- [ ] `backend/tests/test_readiness.py`
- [ ] `backend/tests/test_turn_classifier.py`
- [ ] `backend/tests/test_guardrail.py`
- [ ] `backend/tests/test_gap_tracker.py`
- [ ] `evals/golden_interview_cases.yaml`

---

## 📁 Files to Modify

### Backend
- [ ] `backend/api/sessions.py` — Add turns endpoint, extend session creation
- [ ] `backend/orchestrator/sub_agent.py` — Add adaptive follow-up logic
- [ ] `backend/llm/mock_responses.py` — Add 5 new mock responses

### Frontend
- [ ] `web/components/roleready/InterviewRoom.tsx` — Redesign for 3 panels
- [ ] `web/components/roleready/LiveGapPanel.tsx` — Add gap tracking
- [ ] `web/app/practice/report/page.tsx` — Add all report sections
- [ ] `web/app/dashboard/page.tsx` — Show new fields
- [ ] `web/components/shared/Layout.tsx` — Rebrand to "RoleReady AI"

---

## 🔄 Sync Points

| Day | Event | Who | Action |
|-----|-------|-----|--------|
| 0 | Kickoff | All | Review API contracts |
| 2 | Readiness endpoint live | Ishaq → Shivam | Shivam can start Phase 3 |
| 7 | Turns endpoint live | Shivam → Varad | Varad can start Phase 5 |
| 13 | All complete | All | Integration test |

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Readiness analysis with mock LLM
- [ ] Gap-aware turn classification
- [ ] Ghostwriting regex patterns
- [ ] Gap open/close/probe logic
- [ ] Report generation with fixtures

### Integration Tests
- [ ] End-to-end: analyze → session → turns → finish → report
- [ ] Mock mode: full flow with MOCK_LLM=1
- [ ] DB migration: verify schema changes

### Manual Tests
- [ ] Happy path: full flow from setup to report
- [ ] Ghostwriting attempt: verify refusal
- [ ] Edge cases: empty inputs, session not found, etc.

---

## 🎨 UI Components

### Gap Map (Ishaq)
```
┌─────────────────────────────────────────┐
│  Readiness Score: 58/100 (Amber)        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  Strong (4)    Partial (3)   Missing (4)│
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Python  │  │ SQL     │  │ DB Scale│ │
│  │ REST    │  │ Auth    │  │ Prod    │ │
│  │ Git     │  │ Cloud   │  │ Metrics │ │
│  │ Team    │  └─────────┘  │ Design  │ │
│  └─────────┘               └─────────┘ │
│                                         │
│  Focus: Database design, Scalability    │
└─────────────────────────────────────────┘
```

### Three-Panel Interview (Shivam)
```
┌──────────┬─────────────────┬──────────┐
│ Sidebar  │ Transcript      │ Gap Panel│
│          │                 │          │
│ Q 2/5    │ [Agent]         │ ✓ Flask  │
│ Focus:   │ "Tell me..."    │          │
│ SQL      │                 │ ⚠ DB     │
│          │ [Candidate]     │ Scaling  │
│ Gap:     │ "I used..."     │          │
│ DB Scale │                 │ Why:     │
│          │ [Agent]         │ "Didn't  │
│ Probes:  │ "How would..."  │ cover    │
│ 1/3      │                 │ horiz."  │
│          │ ┌─────────────┐ │          │
│ Status:  │ │ Type here   │ │ Open:    │
│ Active   │ └─────────────┘ │ • Design │
│          │ [Submit] [🎤]   │ • Metrics│
│          │                 │          │
│          │                 │ Closed:  │
│          │                 │ • Python │
└──────────┴─────────────────┴──────────┘
```

---

## 🚨 Common Pitfalls

### Backend
- ❌ Forgetting to update gaps table on each turn
- ❌ Not handling malformed LLM JSON
- ❌ Missing mock responses for new prompts
- ❌ Not validating input lengths
- ✅ Always test with mock mode first

### Frontend
- ❌ Not handling loading states
- ❌ Not showing validation errors inline
- ❌ Forgetting responsive design
- ❌ Not clearing state between sessions
- ✅ Use sessionStorage for multi-step flow

### Integration
- ❌ API contract misalignment
- ❌ Merge conflicts from overlapping files
- ❌ Not testing end-to-end flow
- ❌ Forgetting to update documentation
- ✅ Sync early and often

---

## 🎯 Success Criteria

### Functional
- [ ] Gap analysis works (mock + real)
- [ ] Gap map displays correctly
- [ ] Adaptive interview targets gaps
- [ ] Three-panel UI responsive
- [ ] Reports show gap tracking
- [ ] Dashboard shows new fields

### Quality
- [ ] Unit test coverage ≥ 85%
- [ ] All integration tests pass
- [ ] All eval cases pass
- [ ] No console errors
- [ ] Documentation complete

### Performance
- [ ] Gap analysis < 5s
- [ ] Turn response < 2s
- [ ] Report generation < 6s
- [ ] UI responsive on 1024px+

---

## 📚 Key Documents

| Document | Purpose |
|----------|---------|
| `IMPLEMENTATION_PLAN.md` | Full implementation plan (this is the master) |
| `IMPLEMENTATION_STATUS.md` | What's built vs. planned |
| `requirements.md` | Detailed requirements |
| `design.md` | Technical design |
| `tasks.md` | Task breakdown by person |

---

## 🛠️ Quick Commands

### Backend
```bash
# Start backend (mock mode)
cd backend && conda activate interview-coach
MOCK_LLM=1 uvicorn main:app --reload --port 8000

# Run tests
pytest tests/ -v

# Run specific test
pytest tests/test_readiness.py -v
```

### Frontend
```bash
# Start frontend
cd web && npm run dev

# Build (type check)
npm run build

# Lint
npm run lint
```

### Database
```bash
# Check tables
sqlite3 backend/data/interview_coach.db ".tables"

# Check gaps
sqlite3 backend/data/interview_coach.db "SELECT * FROM gaps;"
```

---

## 💡 Pro Tips

1. **Start with mock mode** — Get the flow working before adding real API
2. **Test incrementally** — Don't wait until the end
3. **Commit often** — Small, working commits
4. **Review API contracts** — Day 1 sync is critical
5. **Use TypeScript** — Let the compiler catch errors
6. **Read the spec** — requirements.md and design.md have all the details
7. **Ask questions** — Better to clarify than guess

---

## 🆘 Getting Help

- **Implementation Plan:** `IMPLEMENTATION_PLAN.md`
- **Status:** `IMPLEMENTATION_STATUS.md`
- **Requirements:** `requirements.md`
- **Design:** `design.md`
- **Slack:** #roleready-mvp-implementation

---

**Print this card and keep it handy!** 📌
