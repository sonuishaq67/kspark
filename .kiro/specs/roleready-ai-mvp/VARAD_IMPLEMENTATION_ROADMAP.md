# Varad's Implementation Roadmap — RoleReady AI MVP

**Owner:** Varad  
**Workstream:** Dashboard, Reporting & Landing Page  
**Timeline:** 3-4 days (hackathon pace)  
**Dependencies:** Shivam's `/finish` endpoint shape (coordinate on Day 1), Ishaq's mock mode setup

---

## 🎯 Your Mission

Build the **feedback report system** and **dashboard** that turns interview data into actionable learning insights. You own the final step of the user journey (Step 5: Report) and the session history dashboard.

**Core Principle:** Coach, don't ghostwrite. Your report shows what the candidate did well, what they missed, and what to practice next — but never gives them scripted answers.

---

## 📋 Pre-Implementation Checklist

### Day 0: Setup & Coordination

- [ ] **Read all three spec files:**
  - `.kiro/specs/roleready-ai-mvp/requirements.md` (focus on Workstream 3)
  - `.kiro/specs/roleready-ai-mvp/design.md` (focus on Report Flow & Components)
  - `.kiro/specs/roleready-ai-mvp/tasks-varad.md` (your complete task list)

- [ ] **Coordinate with Ishaq:**
  - Confirm `MOCK_RESPONSES` structure in `backend/llm/mock_responses.py`
  - Agree on demo scenario data (Backend Engineer Intern)
  - Confirm `reports` table schema in migration `002_roleready_extensions.sql`

- [ ] **Coordinate with Shivam:**
  - Agree on `FinishSessionResponse` shape (Task 3.3)
  - Confirm `TurnResponse.updated_session_state` structure
  - Agree on when `session_status` becomes `"ending"`

- [ ] **Environment setup:**
  ```bash
  cd ~/kspark
  git pull
  
  # Backend setup with conda
  cd backend
  conda create -n roleready python=3.11 -y
  conda activate roleready
  pip install -r requirements.txt
  
  # Frontend setup
  cd ../web
  npm install
  ```

- [ ] **Verify existing code:**
  - Check `backend/api/sessions.py` — understand existing endpoints
  - Check `web/app/dashboard/page.tsx` — understand current dashboard
  - Check `web/components/p2/SessionCard.tsx` — understand current session card

---

## 🗺️ Implementation Phases

### **Phase 1: Backend Foundation** (Day 1, ~4-6 hours)

Build the report generation and retrieval endpoints.

#### 1.1 — Report Generator Prompt (30 min)
**File:** `prompts/report_generator.md`

**What to do:**
1. Create the file with system prompt instructions
2. Include the 5 scoring dimensions with clear definitions
3. Add explicit "no ghostwriting" instruction
4. Define strict JSON output schema
5. Include example output in comments

**Acceptance:**
- Prompt instructs model to analyze turns + gap tracker
- Prompt defines all 5 score dimensions (0–10 each)
- Prompt includes "Do not include model answers" instruction
- JSON schema matches `FinishSessionResponse`

**Reference:** Task 3.1 in `tasks-varad.md`

---

#### 1.2 — Mock Report Response (45 min)
**File:** `backend/llm/mock_responses.py` (extend)

**What to do:**
1. Coordinate with Ishaq on file structure
2. Add `MOCK_RESPONSES["report_generator"]` with demo data
3. Use Backend Engineer Intern scenario
4. Include realistic strengths, gaps, scores, and next steps
5. Test that mock mode returns this data

**Acceptance:**
- Mock response matches `FinishSessionResponse` shape exactly
- All 5 scores are present (0–10)
- Strengths list has 3+ items with evidence
- Gaps list has 3+ items with status
- Next practice plan has 3–5 actionable items

**Reference:** Task 3.2 in `tasks-varad.md`

---

#### 1.3 — DB Query Helpers (1 hour)
**File:** `backend/db/queries.py` (extend)

**What to do:**
1. Add `insert_report()` function
2. Add `get_report()` function
3. Add `get_sessions_list()` extension for new fields
4. Use existing aiosqlite patterns from the file
5. Add proper error handling

**Functions to implement:**
```python
async def insert_report(
    session_id: str,
    summary: str,
    strengths: list[str],
    gaps: list[dict],
    scores: dict,
    follow_up_analysis: list[dict],
    next_practice_plan: list[str],
) -> str:
    """Insert report, return report_id."""

async def get_report(session_id: str) -> dict | None:
    """Return report for session, or None if not generated."""

async def get_sessions_list(user_id: str) -> list[dict]:
    """Return session list with target_role, readiness_score, main_gap."""
```

**Acceptance:**
- All three functions work with SQLite
- `insert_report` generates UUID for report_id
- `get_report` returns None if not found
- `get_sessions_list` includes new fields (target_role, readiness_score, main_gap)

**Reference:** Task 3.5 in `tasks-varad.md`

---

#### 1.4 — Report Generation Endpoint (2-3 hours)
**File:** `backend/api/sessions.py` (extend)

**What to do:**
1. Add `POST /api/sessions/{session_id}/finish` route
2. Load session from orchestrator state or DB
3. Check if report already exists (idempotent)
4. Build LLM context from turns + gap tracker
5. Call Groq or use mock response
6. Parse JSON response
7. Persist to `reports` table
8. Update session state to ENDED
9. Return `FinishSessionResponse`

**Logic flow:**
```python
@router.post("/sessions/{session_id}/finish")
async def finish_session(session_id: str):
    # 1. Load session
    # 2. Check existing report (idempotent)
    # 3. Validate turns exist
    # 4. Build context
    # 5. Call LLM or mock
    # 6. Parse JSON
    # 7. Insert report
    # 8. Update session
    # 9. Return response
```

**Error handling:**
- 404 if session not found
- 422 if zero turns
- 500 if LLM fails or returns malformed JSON
- 200 if report already exists (return existing)

**Acceptance:**
- Endpoint returns `FinishSessionResponse` with all fields
- Mock mode works without API key
- Idempotent (calling twice returns same report)
- Session state updated to ENDED
- `ended_at` timestamp set

**Reference:** Task 3.3 in `tasks-varad.md`

---

#### 1.5 — Report Retrieval Endpoint (1 hour)
**File:** `backend/api/sessions.py` (extend)

**What to do:**
1. Extend `GET /api/sessions/{session_id}/report`
2. Check `reports` table first
3. Return full report if exists
4. Return 404 if not generated yet
5. Extend `GET /api/sessions` list endpoint
6. Add `target_role`, `readiness_score`, `main_gap` to list items

**Acceptance:**
- Returns stored report with metadata
- Returns 404 if report not generated
- List endpoint includes new fields
- `main_gap` is first open gap or null

**Reference:** Task 3.4 in `tasks-varad.md`

---

### **Phase 2: Frontend Components** (Day 2, ~6-8 hours)

Build all React components for the report and dashboard.

#### 2.1 — Report Summary Component (45 min)
**File:** `web/components/roleready/ReportSummary.tsx`

**What to build:**
- Header card with role, date, duration
- Readiness score badge (color-coded)
- Narrative summary paragraph
- Clean, card-based layout

**Props:**
```typescript
interface ReportSummaryProps {
  targetRole: string
  startedAt: string
  endedAt: string | null
  readinessScore: number | null
  summary: string
}
```

**Acceptance:**
- Renders all metadata
- Score badge uses correct colors (0–40 red, 41–70 amber, 71–100 green)
- Duration calculated from timestamps
- Responsive layout

**Reference:** Task 3.7 in `tasks-varad.md`

---

#### 2.2 — Score Card Component (1 hour)
**File:** `web/components/roleready/ScoreCard.tsx`

**What to build:**
- Dimension label (human-readable)
- Large score number (0–10)
- Horizontal progress bar with color coding
- One-line justification text

**Props:**
```typescript
interface ScoreCardProps {
  dimension: string
  score: number
  justification?: string
}
```

**Dimension labels:**
- `role_alignment` → "Role Alignment"
- `technical_clarity` → "Technical Clarity"
- `communication` → "Communication"
- `evidence_strength` → "Evidence Strength"
- `followup_recovery` → "Follow-up Recovery"

**Color coding:**
- 0–4: red
- 5–7: amber
- 8–10: green

**Acceptance:**
- All 5 dimensions render correctly
- Progress bar shows correct percentage
- Colors match score ranges
- Justification text displays below score

**Reference:** Task 3.7 in `tasks-varad.md`

---

#### 2.3 — Follow-Up Analysis Component (1 hour)
**File:** `web/components/roleready/FollowUpAnalysis.tsx` (new)

**What to build:**
- Section title: "Why the AI asked follow-ups"
- Card for each follow-up item
- Question text (bold)
- Reason text
- Response quality badge (Strong/Partial/Weak)

**Props:**
```typescript
interface FollowUpAnalysisProps {
  items: FollowUpAnalysisItem[]
}

interface FollowUpAnalysisItem {
  question: string
  reason: string
  candidate_response_quality: "strong" | "partial" | "weak"
}
```

**Badge colors:**
- Strong: green
- Partial: amber
- Weak: red

**Acceptance:**
- All follow-ups render as cards
- Quality badges show correct colors
- Reason text is readable
- Section only shows if items exist

**Reference:** Task 3.7 in `tasks-varad.md`

---

#### 2.4 — Next Practice Plan Component (1 hour)
**File:** `web/components/roleready/NextPracticePlan.tsx`

**What to build:**
- Ordered list (1, 2, 3...)
- Icon per item based on keywords
- "Start Another Session" CTA button

**Props:**
```typescript
interface NextPracticePlanProps {
  items: string[]
}
```

**Icon logic:**
- Contains "review" or "study" → 📚
- Contains "build" or "code" → 💻
- Else → 🗣

**Acceptance:**
- Items render as ordered list
- Icons match keywords
- CTA button links to `/practice/setup`
- Clean, actionable layout

**Reference:** Task 3.7 in `tasks-varad.md`

---

#### 2.5 — Dashboard Stats Component (1 hour)
**File:** `web/components/roleready/DashboardStats.tsx`

**What to build:**
- Three stat boxes in a row
- Total Sessions count
- Average Readiness Score (X / 100)
- Most Common Gap

**Props:**
```typescript
interface DashboardStatsProps {
  sessions: SessionListItem[]
}
```

**Calculations:**
- Total: `sessions.length`
- Avg score: mean of non-null `readiness_score` values
- Most common gap: mode of `main_gap` values

**Acceptance:**
- Only renders when sessions exist
- All three stats calculate correctly
- Responsive grid layout
- Clean, card-based design

**Reference:** Task 3.8 in `tasks-varad.md`

---

### **Phase 3: Report Page** (Day 2-3, ~3-4 hours)

Build the full report page (Step 5).

#### 3.1 — Report Page Layout (2-3 hours)
**File:** `web/app/practice/report/page.tsx`

**What to build:**
1. Client component with URL query param handling
2. Fetch report on mount
3. Handle 404 (show "Generate Report" button)
4. Render all report sections in order
5. Add CTAs at bottom

**Layout structure:**
```
[StepProgress — step 5 active]
[ReportSummary]
[Grid of 5 × ScoreCard]
[Strengths section — bulleted list]
[Gaps section — color-coded by status]
[FollowUpAnalysis]
[NextPracticePlan]
[CTA buttons: "Start Another Session" | "Back to Dashboard"]
```

**Acceptance:**
- Fetches report from API
- Handles loading state
- Handles 404 with generate button
- All sections render correctly
- CTAs link to correct pages
- Responsive layout

**Reference:** Task 3.6 in `tasks-varad.md`

---

#### 3.2 — Report Page Styling (1 hour)
**File:** `web/app/practice/report/page.tsx` (styling)

**What to do:**
1. Add Tailwind classes for layout
2. Ensure consistent spacing
3. Add section dividers
4. Make responsive (mobile-friendly)
5. Match existing app theme

**Acceptance:**
- Clean, professional layout
- Consistent with rest of app
- Readable on mobile
- Good use of whitespace

**Reference:** Task 3.6 in `tasks-varad.md`

---

### **Phase 4: Dashboard Enhancement** (Day 3, ~3-4 hours)

Rebrand and enhance the dashboard.

#### 4.1 — Update Session Card (1 hour)
**File:** `web/components/p2/SessionCard.tsx` (extend)

**What to do:**
1. Add new props: `targetRole`, `readinessScore`, `mainGap`
2. Show target role as primary label
3. Show readiness score as badge
4. Show main gap in gray text
5. Keep existing functionality

**Acceptance:**
- New fields display correctly
- Falls back gracefully if fields are null
- Maintains existing behavior
- Responsive layout

**Reference:** Task 3.8 in `tasks-varad.md`

---

#### 4.2 — Dashboard Page Updates (2 hours)
**File:** `web/app/dashboard/page.tsx`

**What to do:**
1. Update page title to "RoleReady AI — Dashboard"
2. Add `DashboardStats` at top when sessions exist
3. Update "Start Interview" button to link to `/practice/setup`
4. Add empty state with RoleReady branding
5. Add demo session card when `MOCK_LLM=1` and no sessions

**Empty state:**
- RoleReady AI logo/title
- One-line description
- "Start Your First Practice" CTA → `/practice/setup`

**Acceptance:**
- Stats show when sessions exist
- Empty state shows when no sessions
- Demo session shows in mock mode
- All links point to correct routes
- Branding updated throughout

**Reference:** Task 3.8 in `tasks-varad.md`

---

#### 4.3 — Layout Rebrand (30 min)
**File:** `web/components/shared/Layout.tsx`

**What to do:**
1. Change logo/title to "RoleReady AI"
2. Add nav links: "Practice" → `/practice/setup`, "Dashboard" → `/dashboard`
3. Keep layout clean

**Acceptance:**
- Nav shows "RoleReady AI"
- Nav links work correctly
- Layout remains clean
- Responsive on mobile

**Reference:** Task 3.9 in `tasks-varad.md`

---

### **Phase 5: Polish & Testing** (Day 3-4, ~4-6 hours)

Final touches, testing, and demo data.

#### 5.1 — Landing Page (1-2 hours, optional)
**File:** `web/app/page.tsx`

**Option A: Full landing page (if time permits):**
- Hero section with headline
- Three feature cards
- Single CTA to `/practice/setup`
- Clean, minimal design

**Option B: Simple redirect (if time is short):**
- Keep existing redirect to `/practice/setup`
- Coordinate with Ishaq (he may have done this)

**Acceptance:**
- Either full landing or redirect works
- CTA links to `/practice/setup`
- Matches app theme

**Reference:** Task 3.10 in `tasks-varad.md`

---

#### 5.2 — Eval Golden Cases (1 hour)
**File:** `evals/golden_interview_cases.yaml` (extend)

**What to do:**
1. Add 5 test cases to Ishaq's file
2. Cover: stall, clarify, followup_recovery, ghostwriting_professional, partial_with_strength
3. Use Backend Engineer Intern scenario
4. Include expected outputs

**Acceptance:**
- 5 cases added
- All fields present
- Expected outputs defined
- Cases cover different scenarios

**Reference:** Task 3.11 in `tasks-varad.md`

---

#### 5.3 — Demo Seed Data (30 min)
**File:** `database/seed_data/demo_session.yaml`

**What to do:**
1. Create demo session data
2. Use Backend Engineer Intern scenario
3. Include all required fields
4. Wire into dashboard empty state

**Acceptance:**
- Demo data matches scenario
- Shows in dashboard when `MOCK_LLM=1`
- All fields populated correctly

**Reference:** Task 3.12 in `tasks-varad.md`

---

#### 5.4 — End-to-End Testing (2-3 hours)

**Test scenarios:**

1. **Full flow with mock mode:**
   ```bash
   MOCK_LLM=1 make dev
   ```
   - Navigate through all 5 steps
   - Verify report generates
   - Check dashboard shows session
   - Verify all components render

2. **Report generation:**
   - Complete an interview
   - Click "Finish Interview"
   - Verify report loads
   - Check all sections present
   - Verify scores, strengths, gaps, next steps

3. **Dashboard:**
   - View session list
   - Check stats calculate correctly
   - Verify session cards show new fields
   - Test empty state
   - Test demo session in mock mode

4. **Error handling:**
   - Try to get report before finishing
   - Verify 404 handling
   - Test generate button
   - Check loading states

5. **Responsive design:**
   - Test on mobile viewport
   - Test on tablet viewport
   - Verify all layouts work

**Acceptance:**
- All scenarios pass
- No console errors
- All links work
- Mock mode works end-to-end
- Responsive on all viewports

---

## 📊 Progress Tracking

Use this checklist to track your progress:

### Backend (Day 1)
- [ ] Task 3.1 — Report generator prompt
- [ ] Task 3.2 — Mock report response
- [ ] Task 3.5 — DB query helpers
- [ ] Task 3.3 — Report generation endpoint
- [ ] Task 3.4 — Report retrieval endpoint

### Frontend Components (Day 2)
- [ ] Task 3.7 — ReportSummary component
- [ ] Task 3.7 — ScoreCard component
- [ ] Task 3.7 — FollowUpAnalysis component
- [ ] Task 3.7 — NextPracticePlan component
- [ ] Task 3.8 — DashboardStats component

### Pages (Day 2-3)
- [ ] Task 3.6 — Report page layout
- [ ] Task 3.6 — Report page styling
- [ ] Task 3.8 — Session card updates
- [ ] Task 3.8 — Dashboard page updates
- [ ] Task 3.9 — Layout rebrand

### Polish (Day 3-4)
- [ ] Task 3.10 — Landing page (optional)
- [ ] Task 3.11 — Eval golden cases
- [ ] Task 3.12 — Demo seed data
- [ ] End-to-end testing
- [ ] Bug fixes and polish

---

## 🎨 Design Guidelines

### Color Palette
- **Red (0–40):** `bg-red-100 text-red-800 border-red-300`
- **Amber (41–70):** `bg-amber-100 text-amber-800 border-amber-300`
- **Green (71–100):** `bg-green-100 text-green-800 border-green-300`
- **Indigo (primary):** `bg-indigo-600 text-white`
- **Gray (secondary):** `bg-gray-100 text-gray-700`

### Typography
- **Headings:** `text-2xl font-bold` or `text-xl font-semibold`
- **Body:** `text-base text-gray-700`
- **Labels:** `text-sm font-medium text-gray-600`
- **Scores:** `text-4xl font-bold`

### Spacing
- **Card padding:** `p-6`
- **Section spacing:** `space-y-6`
- **Grid gaps:** `gap-4` or `gap-6`

### Components
- **Cards:** `bg-white rounded-lg shadow-sm border border-gray-200 p-6`
- **Badges:** `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium`
- **Buttons:** `px-4 py-2 rounded-md font-medium transition-colors`

---

## 🔗 Key Dependencies

### From Ishaq (Workstream 1):
- `database/migrations/002_roleready_extensions.sql` — reports table schema
- `backend/llm/mock_responses.py` — mock mode structure
- Demo scenario data (Backend Engineer Intern)

### From Shivam (Workstream 2):
- `POST /api/sessions/{id}/finish` endpoint shape (you implement, but coordinate)
- `TurnResponse.updated_session_state` structure
- Session status transitions

### Coordination Points:
- **Day 1 morning:** Agree on `FinishSessionResponse` shape with Shivam
- **Day 1 afternoon:** Confirm mock response structure with Ishaq
- **Day 2:** Test integration with Shivam's interview flow
- **Day 3:** Final integration testing with both

---

## 🚨 Common Pitfalls to Avoid

1. **Don't ghostwrite:** Never include model answers in the report
2. **Handle null fields:** Not all sessions have `target_role` or `readiness_score`
3. **Idempotent endpoints:** `/finish` should return existing report if called twice
4. **Mock mode:** Test with `MOCK_LLM=1` frequently
5. **Responsive design:** Test on mobile viewport early
6. **Error states:** Handle 404, loading, and empty states
7. **Color coding:** Use consistent colors across all components
8. **JSON parsing:** Handle malformed LLM responses gracefully

---

## 📚 Reference Files

**Must read:**
- `.kiro/specs/roleready-ai-mvp/requirements.md` (Workstream 3)
- `.kiro/specs/roleready-ai-mvp/design.md` (Report Flow section)
- `.kiro/specs/roleready-ai-mvp/tasks-varad.md` (your complete task list)
- `.kiro/steering/architecture.md` (Varad's Module section)
- `.kiro/steering/product.md` (product principles)

**Existing code to understand:**
- `backend/api/sessions.py` — existing endpoints
- `backend/db/queries.py` — existing query patterns
- `web/app/dashboard/page.tsx` — current dashboard
- `web/components/p2/SessionCard.tsx` — current session card
- `web/components/shared/Layout.tsx` — current layout

---

## 🎯 Definition of Done

Your workstream is complete when:

- [ ] `POST /api/sessions/{id}/finish` returns full report JSON
- [ ] `GET /api/sessions/{id}/report` returns stored report or 404
- [ ] `GET /api/sessions` list includes `target_role`, `readiness_score`, `main_gap`
- [ ] Report page renders all sections correctly
- [ ] Score cards show correct color coding
- [ ] Follow-up analysis section works
- [ ] Dashboard shows "RoleReady AI" branding
- [ ] Dashboard stats calculate correctly
- [ ] Session cards show new fields
- [ ] Empty dashboard state works
- [ ] `MOCK_LLM=1` runs full report flow
- [ ] 5 eval cases added
- [ ] Demo seed data works
- [ ] End-to-end flow tested
- [ ] No console errors
- [ ] Responsive on mobile

---

## 🚀 Quick Start Commands

```bash
# Start backend (terminal 1)
cd backend
conda activate roleready
MOCK_LLM=1 uvicorn main:app --reload --port 8000

# Start frontend (terminal 2)
cd web
npm run dev

# Open browser
open http://localhost:3000

# Run tests
cd backend
pytest tests/test_report.py -v

# Check for errors
cd web
npm run build
```

---

## 💡 Pro Tips

1. **Start with mock mode:** Build everything with `MOCK_LLM=1` first
2. **Test incrementally:** Test each component as you build it
3. **Use existing patterns:** Follow patterns from existing code
4. **Coordinate early:** Sync with Ishaq and Shivam on Day 1
5. **Mobile first:** Design for mobile, scale up to desktop
6. **Error handling:** Add error states early, not as an afterthought
7. **Console logs:** Use them liberally during development
8. **Git commits:** Commit after each task completion

---

## 🎬 Demo Script (Your Part)

When demoing to judges, your part is:

1. **After interview ends:** Click "Finish Interview"
2. **Show report page:** Point out the 5 score dimensions
3. **Highlight strengths:** Show transcript evidence
4. **Show gaps:** Point out open/improved/closed status
5. **Explain follow-ups:** "The AI asked this because..."
6. **Show next steps:** "Here's what to practice next"
7. **Navigate to dashboard:** Show session history
8. **Point out stats:** Total sessions, avg score, common gap
9. **Show session card:** Target role, readiness score, main gap

**Key message:** "The report doesn't give you answers — it shows you what to work on."

---

Good luck, Varad! You've got this. 🚀

Remember: **Coach, don't ghostwrite.** Your report is a learning tool, not a cheat sheet.
