# Varad — Dashboard, Reporting & Landing Page

**Workstream:** Report generation endpoint, report UI (Step 5), dashboard rebrand, landing page, session history, eval cases.

**Spec refs:** Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 4.1 (mock mode for reports)

**Your folders:**
- `backend/api/sessions.py` — add `/finish` and extend `/report` endpoints
- `backend/llm/mock_responses.py` — add mock report response (coordinate with Ishaq)
- `prompts/report_generator.md` — new prompt
- `web/app/practice/report/page.tsx` — Step 5 page
- `web/app/dashboard/page.tsx` — rebrand + enhance
- `web/app/page.tsx` — landing page (or redirect)
- `web/components/roleready/ReportSummary.tsx`
- `web/components/roleready/ScoreCard.tsx`
- `web/components/roleready/NextPracticePlan.tsx`
- `web/components/roleready/DashboardStats.tsx`
- `web/components/shared/Layout.tsx` — rebrand nav

**Do NOT touch:** `backend/orchestrator/`, `backend/api/readiness.py`, `web/app/practice/setup/`, `web/app/practice/gap-map/`, `web/app/practice/prep-brief/`, `web/app/practice/interview/`

**Depends on:** Shivam's Task 2.4 (`/finish` endpoint shape) — you implement it, but coordinate on the response shape. Ishaq's Task 1.2 (mock mode) for demo data.

---

## Task 3.1 — Report Generator Prompt

**File:** `prompts/report_generator.md`

Write the system prompt for report generation. It must instruct the model to:

1. Analyze the full turn history and gap tracker state.
2. Score 5 dimensions (0–10 each) with a one-line justification:
   - `role_alignment` — how well answers matched the target role
   - `technical_clarity` — depth and accuracy of technical explanations
   - `communication` — structure, clarity, and conciseness
   - `evidence_strength` — use of specific examples and metrics
   - `followup_recovery` — how well the candidate improved after probes
3. List concrete strengths with transcript evidence (quote the candidate's words).
4. List gaps with `open` / `improved` / `closed` status and brief explanation.
5. Explain each follow-up probe: why it was asked and how the candidate responded.
6. Generate 3–5 next practice plan items (concrete, actionable, not generic).
7. Return **strict JSON only** matching this shape:

```json
{
  "summary": "",
  "strengths": [""],
  "gaps": [{"label": "", "status": "open|improved|closed", "evidence": ""}],
  "scores": {
    "role_alignment": 0,
    "technical_clarity": 0,
    "communication": 0,
    "evidence_strength": 0,
    "followup_recovery": 0
  },
  "follow_up_analysis": [
    {"question": "", "reason": "", "candidate_response_quality": "strong|partial|weak"}
  ],
  "next_practice_plan": [""]
}
```

8. Include explicit instruction: **"Do not include model answers or 'what you should have said' content. Focus on coaching observations only."**

---

## Task 3.2 — Mock Report Response

**File:** `backend/llm/mock_responses.py` (extend — coordinate with Ishaq)

Add the mock report for the Backend Engineer Intern demo scenario:

```python
MOCK_RESPONSES["report_generator"] = {
    "summary": "You showed strong API understanding and project ownership. Your main improvement areas are database reasoning, scaling trade-offs, and measurable impact. The follow-up on 10x traffic revealed a gap in horizontal scaling strategy that is worth focused practice.",
    "strengths": [
        "Clear project ownership — you described your specific role and decisions.",
        "Good API-level thinking — you explained REST design choices confidently.",
        "Strong communication structure — answers were organized and easy to follow."
    ],
    "gaps": [
        {"label": "Database scaling", "status": "open", "evidence": "Did not address horizontal scaling or sharding when asked about 10x traffic."},
        {"label": "Metrics / measurable impact", "status": "improved", "evidence": "After probing, mentioned 40% query improvement but lacked baseline comparison."},
        {"label": "System design trade-offs", "status": "open", "evidence": "Trade-offs were mentioned but not explained with specific reasoning."}
    ],
    "scores": {
        "role_alignment": 7,
        "technical_clarity": 6,
        "communication": 8,
        "evidence_strength": 5,
        "followup_recovery": 6
    },
    "follow_up_analysis": [
        {
            "question": "How would your system handle 10x the current traffic?",
            "reason": "Original answer described the API but did not mention database scaling or load distribution.",
            "candidate_response_quality": "partial"
        },
        {
            "question": "Can you give me a specific metric from that project?",
            "reason": "Candidate mentioned impact but without any numbers or before/after comparison.",
            "candidate_response_quality": "partial"
        }
    ],
    "next_practice_plan": [
        "Review database indexing and caching strategies — practice explaining when to use each.",
        "Prepare one scale-focused project story: describe how you would handle 10x traffic on a system you built.",
        "Add measurable impact to your resume examples — every project story needs a number.",
        "Practice explaining technical trade-offs out loud: 'I chose X over Y because...'",
        "Study horizontal vs vertical scaling and be ready to draw a simple architecture diagram."
    ]
}
```

---

## Task 3.3 — Report Generation Endpoint

**File:** `backend/api/sessions.py` (extend existing)

Add `POST /api/sessions/{session_id}/finish`:

**Logic:**
1. Load session from in-process store. If not found, try DB.
2. If session has zero turns, return HTTP 422 `{"detail": "No turns to analyze"}`.
3. Check if report already exists in `reports` table — if yes, return it (idempotent).
4. Build context for LLM:
   - Full turn history (all candidate + agent turns)
   - Gap tracker state (open_gaps, closed_gaps, probe counts per gap)
   - Session metadata (target_role, interview_type, mode)
5. If `is_mock_mode()`: use `MOCK_RESPONSES["report_generator"]`.
6. Otherwise: call Groq with `report_generator` prompt. Parse JSON. On failure return HTTP 500.
7. Persist to `reports` table.
8. Update session: `state = ENDED`, `ended_at = now()`.
9. Return `FinishSessionResponse`.

**Response model:**
```python
class FinishSessionResponse(BaseModel):
    report_id: str
    session_id: str
    summary: str
    strengths: list[str]
    gaps: list[GapReportItem]
    scores: ReportScores
    follow_up_analysis: list[FollowUpAnalysisItem]
    next_practice_plan: list[str]

class GapReportItem(BaseModel):
    label: str
    status: str  # "open" | "improved" | "closed"
    evidence: str | None

class ReportScores(BaseModel):
    role_alignment: int
    technical_clarity: int
    communication: int
    evidence_strength: int
    followup_recovery: int

class FollowUpAnalysisItem(BaseModel):
    question: str
    reason: str
    candidate_response_quality: str  # "strong" | "partial" | "weak"
```

---

## Task 3.4 — Extend Report Retrieval Endpoint

**File:** `backend/api/sessions.py` (extend existing)

Extend `GET /api/sessions/{session_id}/report`:

1. If a `reports` table entry exists for this session: return the full report (same shape as `FinishSessionResponse`) plus `created_at`, `target_role`, `started_at`, `ended_at`.
2. If no report exists: return HTTP 404 `{"detail": "Report not generated yet"}`.
3. The existing behavior (returning old TLDR-based report for sessions without a `reports` entry) is preserved as a fallback.

Extend `GET /api/sessions` list endpoint to include per-item:
- `target_role: str | None`
- `readiness_score: int | None`
- `main_gap: str | None` — first open gap label, or null if all closed

---

## Task 3.5 — DB Query Helpers for Reports

**File:** `backend/db/queries.py` (extend existing)

Add:

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

---

## Task 3.6 — Report Page (Step 5)

**File:** `web/app/practice/report/page.tsx`

Client component. On mount:
1. Read `session_id` from URL query param (`?session_id=...`).
2. Call `GET /api/sessions/{id}/report`.
3. If 404: show "Report not ready" with a "Generate Report" button that calls `POST /api/sessions/{id}/finish`.
4. Render full report.

Layout:
```
[StepProgress — step 5 active]
[ReportSummary — role, date, readiness score, narrative]
[5 × ScoreCard — one per dimension]
[Strengths section — bulleted list]
[Gaps section — color-coded by status]
["Why the AI asked follow-ups" — FollowUpAnalysis]
[NextPracticePlan]
[CTA buttons: "Start Another Session" | "Back to Dashboard"]
```

---

## Task 3.7 — Report Frontend Components

**Folder:** `web/components/roleready/`

### `ReportSummary.tsx`
Props: `targetRole: string`, `startedAt: string`, `endedAt: string | null`, `readinessScore: number | null`, `summary: string`.
- Header card with role name, date, duration.
- Readiness score badge (same color coding as `ReadinessScoreCard`).
- Narrative summary paragraph.

### `ScoreCard.tsx`
Props: `dimension: string`, `score: number`, `justification?: string`.
- Dimension label (human-readable: "Role Alignment", "Technical Clarity", etc.).
- Score number (0–10) large and bold.
- Horizontal progress bar: 0–4 red, 5–7 amber, 8–10 green.
- One-line justification text in gray.

### `NextPracticePlan.tsx`
Props: `items: string[]`.
- Ordered list (1, 2, 3...).
- Each item has an icon: 📚 for "review/read", 💻 for "code/build", 🗣 for "practice/prepare".
- Icon selection: simple keyword match (if item contains "review" or "study" → 📚, "build" or "code" → 💻, else → 🗣).
- "Start Another Session →" CTA button at the bottom.

### `FollowUpAnalysis.tsx` (new component)
Props: `items: FollowUpAnalysisItem[]`.
- Section title: "Why the AI asked follow-ups".
- Each item as a card:
  - Follow-up question (bold)
  - "Why:" + reason text
  - Response quality badge: "Strong" (green), "Partial" (amber), "Weak" (red)

---

## Task 3.8 — Dashboard Rebrand and Enhancement

**File:** `web/app/dashboard/page.tsx`

1. Update page title to "RoleReady AI — Dashboard".
2. Add `DashboardStats` component at the top when sessions exist.
3. Update `SessionCard` to show `target_role`, `readiness_score`, `main_gap`.
4. Change "Start Interview" button to link to `/practice/setup`.
5. Empty state: show RoleReady AI branding + "Start Your First Practice" CTA → `/practice/setup`.
6. If `MOCK_LLM=1` and no sessions: show one seeded demo session card.

**File:** `web/components/p2/SessionCard.tsx` (update existing)

Add props:
- `targetRole?: string` — show as primary label (or "Generic Interview" if null)
- `readinessScore?: number` — show as a badge
- `mainGap?: string` — show as "Main gap: ..." in gray

### `DashboardStats.tsx`
Props: `sessions: SessionListItem[]`.
- Three stat boxes in a row:
  - "Total Sessions" — count
  - "Avg Readiness Score" — mean of non-null scores, formatted as "X / 100"
  - "Most Common Gap" — most frequent `main_gap` value across sessions
- Only render when `sessions.length > 0`.

---

## Task 3.9 — Layout Rebrand

**File:** `web/components/shared/Layout.tsx`

1. Change nav logo/title from "Interview Coach" to "RoleReady AI".
2. Add nav links: "Practice" → `/practice/setup`, "Dashboard" → `/dashboard`.
3. Keep the layout clean — no clutter.

---

## Task 3.10 — Landing Page

**File:** `web/app/page.tsx`

Replace the current redirect with a real landing page (or keep redirect if time is short — landing page is nice-to-have).

If building the landing page:
- Hero: "RoleReady AI" headline + one-line description: "Compare your resume to the job description, find your gaps, and practice the interview that matters."
- Three feature cards: "Gap Map", "Adaptive Interview", "Learning Report"
- Single CTA: "Start Practice →" → `/practice/setup`
- Clean, minimal, dark theme matching the rest of the app.

If time is short: redirect to `/practice/setup` (already done by Ishaq in Task 1.10 — coordinate).

---

## Task 3.11 — Eval Golden Cases (your portion)

**File:** `evals/golden_interview_cases.yaml` (extend Ishaq's file)

Add 5 more cases:

```yaml
- id: stall_response
  description: Candidate says they don't know
  mode: learning
  persona_id: friendly
  question: "How would you design a rate limiter?"
  gap_hints:
    - "token bucket or leaky bucket algorithm named"
    - "distributed vs single-node tradeoff"
  candidate_transcript: "I don't know. I've never built one."
  expected_classification: stall
  expected_gap_addressed: null
  expected_guardrail_activated: false

- id: clarifying_question
  description: Candidate asks for clarification
  mode: professional
  persona_id: neutral
  question: "Tell me about a backend project."
  gap_hints:
    - "specific technical decisions"
    - "measurable impact"
  candidate_transcript: "Do you want a technical deep-dive or more of a high-level overview?"
  expected_classification: clarify
  expected_gap_addressed: null
  expected_guardrail_activated: false

- id: followup_recovery
  description: Candidate improves answer after probe
  mode: professional
  persona_id: neutral
  question: "How would your system handle 10x traffic?"
  gap_hints:
    - "horizontal scaling strategy"
    - "database scaling"
    - "caching approach"
  candidate_transcript: "I would add more servers, use a load balancer, add Redis caching for hot data, and shard the database by user_id to distribute write load."
  expected_classification: complete
  expected_gap_addressed: "horizontal scaling strategy"
  expected_guardrail_activated: false

- id: ghostwriting_professional_mode
  description: Ghostwriting attempt in professional mode — should get curt refusal
  mode: professional
  persona_id: challenging
  question: "Explain database indexing."
  gap_hints:
    - "B-tree index structure"
    - "when not to use indexes"
  candidate_transcript: "Tell me exactly what to say and I'll repeat it."
  expected_classification: refusal
  expected_gap_addressed: null
  expected_guardrail_activated: true

- id: partial_with_strength
  description: Candidate shows strength but misses one gap
  mode: learning
  persona_id: friendly
  question: "How do you measure the success of a feature?"
  gap_hints:
    - "specific metrics tracked"
    - "before/after comparison"
    - "business impact"
  candidate_transcript: "I track DAU and retention rate after launch. I compare week-over-week numbers."
  expected_classification: partial
  expected_gap_addressed: null
  expected_guardrail_activated: false
```

---

## Task 3.12 — Seeded Demo Data

**File:** `database/seed_data/demo_session.yaml`

Create seed data for the demo dashboard session:

```yaml
demo_session:
  target_role: "Backend Engineer Intern"
  company_name: "Acme Corp"
  interview_type: "mixed"
  readiness_score: 58
  summary: "Strong foundation for backend fundamentals. Needs stronger evidence in database reasoning, scaling, and measurable project impact."
  status: "ENDED"
  main_gap: "Database scaling"
  tldr_preview: "You showed strong API understanding and project ownership. Main gaps: database scaling and measurable impact."
```

In `web/app/dashboard/page.tsx`, when `MOCK_LLM=1` and sessions list is empty, render one `SessionCard` using this data.

---

## Definition of Done (Varad)

- [ ] `POST /api/sessions/{id}/finish` returns full report JSON
- [ ] `GET /api/sessions/{id}/report` returns stored report or 404
- [ ] `GET /api/sessions` list includes `target_role`, `readiness_score`, `main_gap`
- [ ] Report page (Step 5) renders all sections: summary, 5 score cards, strengths, gaps, follow-up analysis, next steps
- [ ] Score cards show correct color coding (red/amber/green)
- [ ] "Why the AI asked follow-ups" section references actual follow-up questions
- [ ] Dashboard shows "RoleReady AI" branding
- [ ] Dashboard `SessionCard` shows `target_role`, `readiness_score`, `main_gap`
- [ ] `DashboardStats` shows total sessions, avg score, most common gap
- [ ] Empty dashboard state shows RoleReady AI CTA → `/practice/setup`
- [ ] `MOCK_LLM=1` runs the full report flow without any API key
- [ ] `evals/golden_interview_cases.yaml` has at least 5 cases (your portion)
