# RoleReady AI MVP — Implementation Plan

**Status:** Ready for Development  
**Estimated Timeline:** 2-3 weeks (3 developers working in parallel)  
**Last Updated:** Current codebase review

---

## Executive Summary

This plan outlines the implementation of the **RoleReady AI MVP** features that are currently planned but not yet built. The implementation is organized into 6 phases across 3 parallel workstreams, with clear dependencies and sync points.

**What We're Building:**
- Gap analysis engine (JD + resume → skill gaps)
- Visual gap map frontend (5-step flow)
- Adaptive interview loop (questions targeting gaps)
- Three-panel interview UI (text-based)
- Structured reports with gap tracking
- Dashboard enhancements

**What's Already Built:**
- ✅ AI Core microservice (6 session types, voice interviews)
- ✅ Legacy backend (database, session management)
- ✅ Frontend (dashboard, interview rooms, components)

---

## Table of Contents

1. [Phase Overview](#phase-overview)
2. [Workstream Breakdown](#workstream-breakdown)
3. [Detailed Implementation Steps](#detailed-implementation-steps)
4. [Dependencies & Sync Points](#dependencies--sync-points)
5. [Testing Strategy](#testing-strategy)
6. [Risk Mitigation](#risk-mitigation)
7. [Success Metrics](#success-metrics)

---

## Phase Overview

### Phase 1: Gap Analysis Foundation (Week 1, Days 1-3)
**Owner:** Ishaq  
**Goal:** Build backend endpoint for JD + resume analysis  
**Deliverables:**
- `POST /api/readiness/analyze` endpoint
- `prompts/readiness_analysis.md` prompt
- Mock response for demo mode
- Database integration (gaps table)

### Phase 2: Gap Map Frontend (Week 1, Days 4-5)
**Owner:** Ishaq  
**Goal:** Build visual gap display UI  
**Deliverables:**
- InputPanel component (JD + resume input)
- ReadinessScoreCard component
- SkillGapMap component (3 columns)
- PrepBriefCard component
- Gap map and prep brief pages

### Phase 3: Adaptive Interview Backend (Week 2, Days 1-3)
**Owner:** Shivam  
**Goal:** Build gap-driven interview orchestration  
**Deliverables:**
- Gap-driven session creation
- Typed turn endpoint
- Adaptive follow-up logic
- Gap-aware prompts
- Gap status updates

### Phase 4: Three-Panel Interview UI (Week 2, Days 4-5)
**Owner:** Shivam  
**Goal:** Build text-based interview interface  
**Deliverables:**
- Three-panel InterviewRoom layout
- Left sidebar (session metadata)
- Center panel (transcript + input)
- Right panel (LiveGapPanel with gap tracking)
- Responsive design

### Phase 5: Structured Reports (Week 3, Days 1-3)
**Owner:** Varad  
**Goal:** Build comprehensive feedback reports  
**Deliverables:**
- Report generation endpoint
- Structured report prompt
- Report page with all sections
- Dashboard enhancements
- Layout rebrand

### Phase 6: Testing & Polish (Week 3, Days 4-5)
**Owner:** All  
**Goal:** End-to-end testing and refinement  
**Deliverables:**
- Eval golden cases
- Unit tests
- Integration tests
- Mock mode verification
- Documentation updates

---

## Workstream Breakdown

### Workstream 1: Gap Analysis Engine (Ishaq)

**Total Effort:** 5 days  
**Dependencies:** None (can start immediately)

#### Tasks

**Phase 1: Backend Foundation (3 days)**

1. **Create Readiness Analysis Endpoint** (1 day)
   - File: `backend/api/readiness.py`
   - Implement `POST /api/readiness/analyze`
   - Accept: target_role, job_description, resume, company_name, interview_type
   - Return: ReadinessAnalysisResponse
   - Validation: JD min 50 chars, resume min 50 chars
   - Validation: JD max 8000 chars, resume max 6000 chars
   - Error handling: 422 for validation, 500 for LLM failure

2. **Create Readiness Analysis Prompt** (0.5 days)
   - File: `prompts/readiness_analysis.md`
   - Instruct LLM to compare JD vs resume
   - Return strict JSON with skill categorization
   - Include readiness score (0-100)
   - Include interview focus areas (ordered)
   - Include prep brief (5-7 bullets)

3. **Add Mock Response** (0.5 days)
   - File: `backend/llm/mock_responses.py`
   - Add `MOCK_RESPONSES["readiness_analysis"]`
   - Use "Backend Engineer Intern" scenario
   - Readiness score: 58
   - Strong: Python, REST APIs, Git, Team project
   - Partial: SQL, Authentication, Cloud basics
   - Missing: Database scaling, Production debugging, Metrics, System design

4. **Database Integration** (1 day)
   - Create session record with readiness fields
   - Insert gaps into gaps table
   - Test with mock mode
   - Test with real Groq API
   - Verify idempotency

**Phase 2: Frontend Components (2 days)**

5. **Create InputPanel Component** (0.5 days)
   - File: `web/components/roleready/InputPanel.tsx`
   - Target role text input
   - JD textarea (min 3 rows, expandable)
   - Resume textarea (min 5 rows, expandable)
   - Company name input (optional)
   - Interview type selector (technical/behavioral/mixed)
   - "Analyze My Readiness" button with loading state
   - Inline validation errors

6. **Create ReadinessScoreCard Component** (0.5 days)
   - File: `web/components/roleready/ReadinessScoreCard.tsx`
   - Large circular score display (0-100)
   - Color coding: 0-40 red, 41-70 amber, 71-100 green
   - Summary text below score
   - Skill count badges (X strong, Y partial, Z missing)

7. **Create SkillGapMap Component** (0.5 days)
   - File: `web/components/roleready/SkillGapMap.tsx`
   - Three columns: Strong (green), Partial (amber), Missing (red)
   - Each skill as a badge
   - Evidence tooltip on hover
   - Interview focus areas list below map

8. **Create PrepBriefCard Component** (0.25 days)
   - File: `web/components/roleready/PrepBriefCard.tsx`
   - Bulleted prep checklist
   - "Start Interview" CTA button

9. **Create Gap Map Pages** (0.25 days)
   - File: `web/app/practice/gap-map/page.tsx`
   - Render ReadinessScoreCard + SkillGapMap
   - File: `web/app/practice/prep-brief/page.tsx`
   - Render PrepBriefCard
   - Wire up navigation flow

**Deliverables:**
- ✅ Working readiness analysis endpoint
- ✅ Visual gap map with 3 columns
- ✅ Prep brief page
- ✅ Mock mode support
- ✅ Database integration

---

### Workstream 2: Adaptive Interview Loop (Shivam)

**Total Effort:** 5 days  
**Dependencies:** Ishaq Phase 1 complete (for gap data structure)

#### Tasks

**Phase 3: Backend Orchestration (3 days)**

1. **Extend Session Creation** (1 day)
   - File: `backend/api/sessions.py`
   - Extend `POST /api/sessions` to accept readiness_analysis
   - Generate 4-6 questions from missing_or_weak + partial_matches
   - Order by interview_focus_areas priority
   - Initialize open_gaps list in SessionState
   - Attach gap context to each question
   - Return total_questions in response

2. **Create Typed Turn Endpoint** (1 day)
   - File: `backend/api/sessions.py`
   - Implement `POST /api/sessions/{id}/turns`
   - Accept: {user_message: string}
   - Return: TurnResponse with gap tracking
   - Persist candidate + agent turns to turns table
   - Update gaps table (open → improved → closed)
   - Signal session_status = "ending" when done
   - Error handling: 404 if session not found, 409 if ended

3. **Implement Adaptive Follow-Up Logic** (1 day)
   - File: `backend/orchestrator/sub_agent.py`
   - Select highest-priority open gap
   - Generate follow-up targeting specific gap
   - Track probe count per gap (max 3)
   - Return follow_up_reason in response
   - Transition to "ending" when all gaps closed

4. **Create Gap-Aware Prompts** (0.5 days)
   - File: `prompts/turn_classifier.md`
   - Extend classify_turn with gap detection
   - Return: kind, gap_addressed, detected_strengths, follow_up_reason
   - File: `prompts/followup_generator.md`
   - Generate follow-up targeting specific gap
   - Include follow_up_reason in output
   - File: `prompts/guardrail.md`
   - Mode-aware refusal (learning vs professional)

5. **Add Mock Responses** (0.5 days)
   - File: `backend/llm/mock_responses.py`
   - Add `MOCK_RESPONSES["turn_classifier_gap_aware"]`
   - Add `MOCK_RESPONSES["followup_generator_gap"]`
   - Add `MOCK_RESPONSES["guardrail_learning"]`
   - Add `MOCK_RESPONSES["guardrail_professional"]`

**Phase 4: Frontend UI (2 days)**

6. **Redesign InterviewRoom for Three Panels** (1 day)
   - File: `web/components/roleready/InterviewRoom.tsx`
   - Three-panel layout: sidebar + center + gap panel
   - Left sidebar (240px): session metadata
     - Question number (e.g., "Question 2 of 5")
     - Interview focus area
     - Current gap being tested
     - Probe count (e.g., "1 / 3")
     - Session status
   - Center panel (flex): transcript + input
     - Scrollable transcript with TranscriptBubble
     - Text input box (primary)
     - Submit button
     - Mic button (secondary/optional)
   - Right panel (280px): LiveGapPanel

7. **Update LiveGapPanel for Gap Tracking** (0.5 days)
   - File: `web/components/roleready/LiveGapPanel.tsx`
   - Show detected strength (green chip)
   - Show missing gap (amber chip)
   - Show follow-up reason (italic text)
   - Show open gaps list
   - Show closed gaps list
   - Show probe count indicator

8. **Add Responsive Design** (0.5 days)
   - Three-panel layout for ≥ 1024px
   - Stacked layout for ≥ 768px
   - Mobile-friendly for < 768px

**Deliverables:**
- ✅ Gap-driven question generation
- ✅ Typed turn endpoint
- ✅ Adaptive follow-up logic
- ✅ Three-panel interview UI
- ✅ Gap tracking in real-time
- ✅ Mock mode support

---

### Workstream 3: Reports & Dashboard (Varad)

**Total Effort:** 5 days  
**Dependencies:** Shivam Phase 3 complete (for turn data)

#### Tasks

**Phase 5: Backend Reports (2 days)**

1. **Create Report Generation Endpoint** (1 day)
   - File: `backend/api/sessions.py`
   - Implement `POST /api/sessions/{id}/finish`
   - Load all turns + gap tracker state
   - Call Groq LLM with report_generator prompt
   - Parse JSON response
   - Return: summary, strengths, gaps, scores (5 dimensions), follow_up_analysis, next_practice_plan
   - Persist to reports table
   - Update session state to ENDED
   - Idempotent (return existing if called twice)
   - Error handling: 422 if no turns, 500 if LLM fails

2. **Create Report Retrieval Endpoint** (0.5 days)
   - File: `backend/api/sessions.py`
   - Implement `GET /api/sessions/{id}/report`
   - Return stored report if exists
   - Include session metadata (target_role, started_at, ended_at)
   - Error handling: 404 if report not generated

3. **Create Report Prompt** (0.5 days)
   - File: `prompts/report_generator.md`
   - Analyze full turn history + gap tracker state
   - Score 5 dimensions (0-10 each): role_alignment, technical_clarity, communication, evidence_strength, followup_recovery
   - List strengths with transcript evidence
   - List gaps with open/improved/closed status
   - Explain each follow-up probe
   - Generate 3-5 item next practice plan
   - Return strict JSON

4. **Add Mock Response** (0.5 days)
   - File: `backend/llm/mock_responses.py`
   - Add `MOCK_RESPONSES["report_generator"]`
   - Use "Backend Engineer Intern" scenario
   - Include all 5 scores
   - Include strengths, gaps, follow-ups, next steps

**Phase 5: Frontend Reports & Dashboard (3 days)**

5. **Update Report Page** (1 day)
   - File: `web/app/practice/report/page.tsx`
   - Render ReportSummary (already exists)
   - Render 5 ScoreCard components (already exists)
   - Render strengths list
   - Render gaps list with status badges
   - Render FollowUpAnalysis section (already exists)
   - Render NextPracticePlan (already exists)
   - Add "Start Another Session" CTA → `/practice/setup`
   - Add "Back to Dashboard" link

6. **Update Dashboard** (1 day)
   - File: `web/app/dashboard/page.tsx`
   - Show DashboardStats at top (already exists)
   - Update SessionCard to show:
     - target_role (or "Generic Interview" if null)
     - readiness_score (or dash if null)
     - main_gap (or dash if null)
     - Status badge
     - "View Report" link
   - Update "Start Interview" button → `/practice/setup`
   - Update empty state with RoleReady branding

7. **Rebrand Layout** (0.5 days)
   - File: `web/components/shared/Layout.tsx`
   - Update nav bar to "RoleReady AI"
   - Ensure consistent branding across all pages

8. **Add Demo Data** (0.5 days)
   - File: `database/seed_data/demo_session.yaml`
   - Create demo session with "Backend Engineer Intern" scenario
   - Include gaps, turns, and report
   - Show in dashboard when MOCK_LLM=1 and no real sessions

**Deliverables:**
- ✅ Structured report generation
- ✅ Report retrieval endpoint
- ✅ Full report page
- ✅ Enhanced dashboard
- ✅ Rebranded layout
- ✅ Demo data for mock mode

---

### Phase 6: Testing & Polish (All)

**Total Effort:** 2 days  
**Dependencies:** All phases complete

#### Tasks

1. **Create Eval Golden Cases** (0.5 days)
   - File: `evals/golden_interview_cases.yaml`
   - 8+ test cases covering:
     - Strong answer (expect `complete`)
     - Partial answer (expect `partial` + specific gap)
     - Stall (expect `stall`)
     - Ghostwriting attempt (expect `refusal`)
     - Clarifying question (expect `clarify`)
     - Follow-up recovery (candidate improves after probe)
     - Guardrail in learning mode
     - Guardrail in professional mode
   - Use "Backend Engineer Intern" scenario

2. **Add Unit Tests** (0.5 days)
   - File: `backend/tests/test_readiness.py`
   - Test analyze_readiness() with mock LLM
   - File: `backend/tests/test_turn_classifier.py`
   - Test gap-aware classification
   - File: `backend/tests/test_guardrail.py`
   - Test ghostwriting regex patterns
   - File: `backend/tests/test_gap_tracker.py`
   - Test gap open/close/probe logic
   - File: `backend/tests/test_report.py`
   - Test report generation with fixture data

3. **Add Integration Tests** (0.5 days)
   - End-to-end flow test: analyze → session → turns → finish → report
   - Mock mode test: full flow with MOCK_LLM=1
   - DB migration test: verify schema changes

4. **Verify Mock Mode** (0.25 days)
   - Test full flow with MOCK_LLM=1
   - Verify deterministic responses
   - Verify no API calls made
   - Test all endpoints

5. **Update Documentation** (0.25 days)
   - Update README.md with new features
   - Update QUICK_START.md with new flow
   - Update RUN_GUIDE.md with new endpoints
   - Update IMPLEMENTATION_STATUS.md (mark as complete)

**Deliverables:**
- ✅ Eval golden cases
- ✅ Unit tests
- ✅ Integration tests
- ✅ Mock mode verified
- ✅ Documentation updated

---

## Dependencies & Sync Points

### Critical Path

```
Phase 1 (Ishaq)
    ↓
Phase 2 (Ishaq) ← Can start after Phase 1 Day 2
    ↓
Phase 3 (Shivam) ← Needs Phase 1 complete
    ↓
Phase 4 (Shivam) ← Can start after Phase 3 Day 2
    ↓
Phase 5 (Varad) ← Needs Phase 3 complete
    ↓
Phase 6 (All) ← Needs all phases complete
```

### Sync Points

| When | What | Who | Action |
|------|------|-----|--------|
| Day 1 Start | Agree on API shapes | All 3 | Review ReadinessAnalysisResponse, TurnResponse, FinishSessionResponse |
| Day 2 End | Readiness endpoint live | Ishaq → Shivam | Shivam can start gap-driven session creation |
| Day 7 End | Typed turn endpoint live | Shivam → Varad | Varad can start report generation |
| Day 13 End | All features complete | All 3 | Integration smoke test |

### Parallel Work Opportunities

**Week 1:**
- Ishaq: Phase 1 (backend) + Phase 2 (frontend)
- Shivam: Can start Phase 3 planning, review Ishaq's API shapes
- Varad: Can start Phase 5 planning, design report UI

**Week 2:**
- Ishaq: Support Shivam with gap data questions
- Shivam: Phase 3 (backend) + Phase 4 (frontend)
- Varad: Can start Phase 5 frontend work (components already exist)

**Week 3:**
- Ishaq: Testing support
- Shivam: Testing support
- Varad: Phase 5 (backend + frontend) + Phase 6 coordination

---

## Testing Strategy

### Unit Testing

**Backend Tests:**
```bash
cd backend
pytest tests/test_readiness.py -v
pytest tests/test_turn_classifier.py -v
pytest tests/test_guardrail.py -v
pytest tests/test_gap_tracker.py -v
pytest tests/test_report.py -v
```

**Coverage Targets:**
- Readiness analysis: 90%+
- Turn classification: 90%+
- Gap tracking: 85%+
- Report generation: 85%+

### Integration Testing

**End-to-End Flow:**
1. POST /api/readiness/analyze → get session_id
2. POST /api/sessions with readiness_analysis → get intro_message
3. POST /api/sessions/{id}/turns (3 turns) → verify gap updates
4. POST /api/sessions/{id}/finish → get report
5. GET /api/sessions/{id}/report → verify persistence

**Mock Mode Test:**
- Set MOCK_LLM=1
- Run full flow
- Verify deterministic responses
- Verify no API calls

### Manual Testing

**Happy Path:**
1. Go to /practice/setup
2. Enter JD + resume (or load demo data)
3. Click "Analyze My Readiness"
4. Review gap map
5. Review prep brief
6. Click "Start Interview"
7. Answer 3 questions (type text)
8. Try ghostwriting attempt ("write the answer for me")
9. Click "Finish Interview"
10. Review full report
11. Go to dashboard
12. Verify session appears with new fields

**Edge Cases:**
- Empty JD/resume (expect validation error)
- Very long JD/resume (expect truncation)
- Session not found (expect 404)
- Session already ended (expect 409)
- No turns in session (expect 422)
- Malformed LLM response (expect 500)

### Property-Based Testing

**Using Hypothesis:**
```python
from hypothesis import given, strategies as st

@given(st.integers(min_value=0, max_value=100))
def test_readiness_score_in_range(score):
    assert 0 <= score <= 100

@given(st.lists(st.text(), min_size=1))
def test_skills_categorized_once(skills):
    # Every skill appears in exactly one category
    pass
```

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| LLM returns malformed JSON | High | Medium | Add robust JSON parsing with fallbacks, extensive prompt testing |
| Gap tracking logic bugs | High | Medium | Comprehensive unit tests, property-based tests |
| Frontend state management issues | Medium | Medium | Use sessionStorage, clear state flow |
| Performance issues with large JDs | Medium | Low | Add input length limits, test with max-size inputs |
| Mock mode inconsistencies | Low | Medium | Maintain mock responses in sync with real responses |

### Process Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| API contract misalignment | High | Low | Sync point on Day 1, document contracts clearly |
| Merge conflicts | Medium | Medium | Clear file ownership, frequent commits |
| Scope creep | Medium | Medium | Stick to spec, defer enhancements to Phase 7 |
| Testing delays | Medium | Low | Allocate full 2 days for Phase 6 |

### Mitigation Strategies

1. **Daily standups** — 15 min sync on progress and blockers
2. **API contract review** — Day 1 sync point (mandatory)
3. **Code reviews** — All PRs reviewed by at least one other person
4. **Mock mode first** — Test with mock mode before real API
5. **Incremental commits** — Commit working code frequently
6. **Documentation as you go** — Update docs with each feature

---

## Success Metrics

### Functional Completeness

- [ ] All 3 workstreams complete
- [ ] All endpoints implemented and tested
- [ ] All frontend components implemented
- [ ] Mock mode works end-to-end
- [ ] Real API mode works end-to-end

### Quality Metrics

- [ ] Unit test coverage ≥ 85%
- [ ] All integration tests passing
- [ ] All eval golden cases passing
- [ ] No critical bugs
- [ ] Documentation complete

### User Experience

- [ ] Gap map loads in < 5s
- [ ] Turn response in < 2s
- [ ] Report generation in < 6s
- [ ] UI responsive on 1024px+ screens
- [ ] No console errors

### Demo Readiness

- [ ] Full flow works with mock mode
- [ ] Demo data seeded
- [ ] Clear demo script
- [ ] All features visible in demo
- [ ] Ghostwriting refusal works

---

## Timeline Summary

### Week 1: Foundation
- **Days 1-3:** Ishaq builds gap analysis backend
- **Days 4-5:** Ishaq builds gap map frontend
- **Milestone:** Gap analysis working end-to-end

### Week 2: Adaptive Interview
- **Days 1-3:** Shivam builds adaptive interview backend
- **Days 4-5:** Shivam builds three-panel UI
- **Milestone:** Adaptive interview working end-to-end

### Week 3: Reports & Polish
- **Days 1-3:** Varad builds reports + dashboard
- **Days 4-5:** All hands on testing & polish
- **Milestone:** Full RoleReady AI MVP complete

---

## Next Steps

### Immediate Actions (Day 0)

1. **Team Kickoff Meeting** (1 hour)
   - Review this implementation plan
   - Agree on API contracts
   - Assign workstreams
   - Set up communication channels

2. **Environment Setup** (1 hour)
   - All developers set up local environment
   - Verify backend + frontend running
   - Verify mock mode working
   - Create feature branches

3. **API Contract Review** (30 min)
   - Review ReadinessAnalysisResponse
   - Review TurnResponse
   - Review FinishSessionResponse
   - Document in shared doc

### Day 1 Start

- **Ishaq:** Start Phase 1, Task 1 (Create readiness endpoint)
- **Shivam:** Review Phase 3 tasks, prepare prompts
- **Varad:** Review Phase 5 tasks, design report UI

### Communication

- **Daily standup:** 9:00 AM (15 min)
- **Sync points:** As scheduled in dependencies table
- **Slack channel:** #roleready-mvp-implementation
- **Code reviews:** Within 4 hours of PR creation

---

## Appendix

### File Checklist

**Backend Files to Create:**
- [ ] `backend/api/readiness.py`
- [ ] `prompts/readiness_analysis.md`
- [ ] `prompts/turn_classifier.md`
- [ ] `prompts/followup_generator.md`
- [ ] `prompts/guardrail.md`

**Backend Files to Modify:**
- [ ] `backend/api/sessions.py` (extend)
- [ ] `backend/orchestrator/sub_agent.py` (extend)
- [ ] `backend/llm/mock_responses.py` (add responses)

**Frontend Files to Create:**
- [ ] `web/components/roleready/InputPanel.tsx`
- [ ] `web/components/roleready/ReadinessScoreCard.tsx`
- [ ] `web/components/roleready/SkillGapMap.tsx`
- [ ] `web/components/roleready/PrepBriefCard.tsx`
- [ ] `web/app/practice/gap-map/page.tsx`
- [ ] `web/app/practice/prep-brief/page.tsx`

**Frontend Files to Modify:**
- [ ] `web/components/roleready/InterviewRoom.tsx` (redesign)
- [ ] `web/components/roleready/LiveGapPanel.tsx` (extend)
- [ ] `web/app/practice/report/page.tsx` (extend)
- [ ] `web/app/dashboard/page.tsx` (extend)
- [ ] `web/components/shared/Layout.tsx` (rebrand)

**Test Files to Create:**
- [ ] `backend/tests/test_readiness.py`
- [ ] `backend/tests/test_turn_classifier.py`
- [ ] `backend/tests/test_guardrail.py`
- [ ] `backend/tests/test_gap_tracker.py`
- [ ] `evals/golden_interview_cases.yaml`

### Reference Documents

- **Requirements:** `.kiro/specs/roleready-ai-mvp/requirements.md`
- **Design:** `.kiro/specs/roleready-ai-mvp/design.md`
- **Tasks:** `.kiro/specs/roleready-ai-mvp/tasks.md`
- **Status:** `.kiro/specs/roleready-ai-mvp/IMPLEMENTATION_STATUS.md`
- **Architecture:** `.kiro/steering/architecture.md`
- **Product:** `.kiro/steering/product.md`

---

**Ready to start?** Schedule the kickoff meeting and let's build! 🚀
