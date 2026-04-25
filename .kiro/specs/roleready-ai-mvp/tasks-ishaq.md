# Ishaq — JD/Resume Gap Engine & Research Microservice

**Workstream:** Gap analysis, readiness scoring, DB schema, mock mode, Steps 1–3 of the practice flow.

**Spec refs:** Requirements 1.1, 1.2, 1.3, 4.1, 4.2 (backward compat), 4.3 (responsible AI)

**Your folders:**
- `backend/api/` — new readiness route
- `backend/llm/mock_responses.py` — new mock data file
- `prompts/readiness_analysis.md` — new prompt
- `database/migrations/002_roleready_extensions.sql` — DB migration
- `database/seed_data/demo_session.yaml` — demo gap seed data
- `web/app/practice/` — Steps 1, 2, 3 pages
- `web/components/roleready/` — InputPanel, StepProgress, ReadinessScoreCard, SkillGapMap, PrepBriefCard

**Do NOT touch:** `backend/orchestrator/`, `backend/speech/`, `web/app/interview/`, `web/app/report/`, `web/app/dashboard/`

---

## Task 1.1 — DB Migration

**File:** `database/migrations/002_roleready_extensions.sql`

Write an idempotent SQL migration that:

1. Adds columns to `sessions` table using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`:
   - `target_role TEXT`
   - `company_name TEXT`
   - `interview_type TEXT DEFAULT 'mixed'`
   - `readiness_score INTEGER`
   - `summary TEXT`

2. Creates `gaps` table:
```sql
CREATE TABLE IF NOT EXISTS gaps (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    category    TEXT NOT NULL CHECK (category IN ('strong', 'partial', 'missing')),
    evidence    TEXT,
    status      TEXT NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open', 'improved', 'closed')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS gaps_session ON gaps (session_id);
```

3. Wire this migration into `backend/db/init.py` so it runs on app startup after the existing schema.

**Acceptance:** Running `make dev` twice in a row does not error. Existing `sessions` and `turns` rows survive.

---

## Task 1.2 — Mock LLM Responses

**File:** `backend/llm/mock_responses.py`

Create a module with deterministic fixture data for the demo scenario (Backend Engineer Intern).

```python
MOCK_RESPONSES: dict[str, dict] = {
    "readiness_analysis": {
        "readiness_score": 58,
        "summary": "Strong foundation for backend fundamentals. Needs stronger evidence in database reasoning, scaling, and measurable project impact.",
        "strong_matches": [
            {"label": "Python", "evidence": "Mentions Python throughout resume", "category": "strong"},
            {"label": "REST APIs", "evidence": "Built a Flask API", "category": "strong"},
            {"label": "Git", "evidence": "Used Git for team project", "category": "strong"},
            {"label": "Team projects", "evidence": "Worked on a team project", "category": "strong"}
        ],
        "partial_matches": [
            {"label": "SQL", "evidence": "Mentions database but no depth", "category": "partial"},
            {"label": "Authentication", "evidence": "Vague mention of auth", "category": "partial"},
            {"label": "Cloud basics", "evidence": "No specific cloud experience", "category": "partial"}
        ],
        "missing_or_weak": [
            {"label": "Database scaling", "evidence": None, "category": "missing"},
            {"label": "Production debugging", "evidence": None, "category": "missing"},
            {"label": "Metrics / measurable impact", "evidence": None, "category": "missing"},
            {"label": "System design trade-offs", "evidence": None, "category": "missing"}
        ],
        "interview_focus_areas": [
            "Database design and scaling",
            "System scalability",
            "Measurable project impact",
            "API design decisions",
            "Production debugging approach"
        ],
        "prep_brief": [
            "Prepare one backend project story with measurable outcomes (e.g., reduced latency by X%).",
            "Review database indexing, caching strategies, and horizontal vs vertical scaling.",
            "Be ready to explain trade-offs in your technical decisions.",
            "Use STAR format for behavioral answers — Situation, Task, Action, Result.",
            "Avoid memorized answers; focus on your reasoning process.",
            "Practice explaining how you would handle 10x traffic on a system you built.",
            "Prepare a concrete example of a production issue you debugged."
        ]
    }
}
```

Also update `backend/llm/client.py` to check `MOCK_LLM` env var (or missing `GROQ_API_KEY`) and return `MOCK_RESPONSES[prompt_name]` instead of calling Groq. Add a helper:

```python
def is_mock_mode() -> bool:
    return os.getenv("MOCK_LLM", "0") == "1" or not os.getenv("GROQ_API_KEY")
```

**Acceptance:** `MOCK_LLM=1 python -c "from llm.mock_responses import MOCK_RESPONSES; print(MOCK_RESPONSES['readiness_analysis']['readiness_score'])"` prints `58`.

---

## Task 1.3 — Readiness Analysis Prompt

**File:** `prompts/readiness_analysis.md`

Write the system prompt for the gap analysis LLM call. It must:

1. Instruct the model to compare JD requirements against resume evidence.
2. Assign a readiness score 0–100 (not harsh — frame as a learning diagnosis).
3. Categorize each skill as `strong` / `partial` / `missing` with a short evidence quote from the resume (or null).
4. Identify 3–5 interview focus areas ordered by importance.
5. Generate 5–7 prep brief bullet points (concrete actions, not generic advice).
6. Return **strict JSON only** — no prose before or after — matching this exact shape:

```json
{
  "readiness_score": 0,
  "summary": "",
  "strong_matches": [{"label": "", "evidence": "", "category": "strong"}],
  "partial_matches": [{"label": "", "evidence": null, "category": "partial"}],
  "missing_or_weak": [{"label": "", "evidence": null, "category": "missing"}],
  "interview_focus_areas": [],
  "prep_brief": []
}
```

7. Include an explicit instruction: **"Do not write interview answers for the candidate. Your role is analysis only."**

---

## Task 1.4 — Readiness Analysis Backend Endpoint

**File:** `backend/api/readiness.py` (new file)

Implement `POST /api/readiness/analyze`:

1. Pydantic request model:
```python
class ReadinessAnalyzeRequest(BaseModel):
    target_role: str
    job_description: str = Field(min_length=50, max_length=8000)
    resume: str = Field(min_length=50, max_length=6000)
    company_name: str | None = None
    interview_type: Literal["technical", "behavioral", "mixed"] = "mixed"
```

2. Logic:
   - If `is_mock_mode()`: return `MOCK_RESPONSES["readiness_analysis"]` with a new `session_id`.
   - Otherwise: call Groq with `readiness_analysis` prompt + JD + resume. Parse JSON response. On parse failure return HTTP 500 `{"detail": "Analysis failed"}`.
   - Create a session row in DB with `target_role`, `company_name`, `interview_type`, `readiness_score`, `summary`.
   - Insert each skill item into `gaps` table with correct `category` and `evidence`.
   - Return `ReadinessAnalysisResponse` including the new `session_id`.

3. Register the router in `backend/main.py`:
```python
from api.readiness import router as readiness_router
app.include_router(readiness_router)
```

**Acceptance:** `curl -X POST http://localhost:8000/api/readiness/analyze -H "Content-Type: application/json" -d '{"target_role":"Backend Intern","job_description":"...50+ chars...","resume":"...50+ chars...","interview_type":"mixed"}' ` returns JSON with `readiness_score`, `strong_matches`, `partial_matches`, `missing_or_weak`.

---

## Task 1.5 — DB Query Helpers for Gaps

**File:** `backend/db/queries.py` (extend existing)

Add these async functions:

```python
async def insert_gaps(session_id: str, gaps: list[dict]) -> None:
    """Insert gap items from readiness analysis into gaps table."""

async def get_gaps(session_id: str) -> list[dict]:
    """Return all gaps for a session."""

async def update_gap_status(gap_id: str, status: str) -> None:
    """Update a gap's status: open → improved → closed."""
```

---

## Task 1.6 — Practice Flow Pages (Steps 1–3)

**Files:**
- `web/app/practice/page.tsx` — redirects to `/practice/setup`
- `web/app/practice/setup/page.tsx` — Step 1
- `web/app/practice/gap-map/page.tsx` — Step 2
- `web/app/practice/prep-brief/page.tsx` — Step 3

**State management:** Use `sessionStorage` to pass `session_id` and analysis result between steps. No URL params for large text.

Step 1 (`setup/page.tsx`):
- Renders `InputPanel` component.
- On submit: calls `POST /api/readiness/analyze`, stores result in `sessionStorage`, navigates to `/practice/gap-map`.
- Shows loading state during API call.
- Shows inline validation errors for empty required fields.

Step 2 (`gap-map/page.tsx`):
- Reads analysis from `sessionStorage`.
- Renders `StepProgress` (step 2 active) + `ReadinessScoreCard` + `SkillGapMap`.
- "Continue to Prep Brief" button navigates to `/practice/prep-brief`.

Step 3 (`prep-brief/page.tsx`):
- Reads analysis from `sessionStorage`.
- Renders `StepProgress` (step 3 active) + `PrepBriefCard`.
- "Start Interview" button navigates to `/practice/interview` (Shivam's page).

---

## Task 1.7 — Frontend Components (Steps 1–3)

**Folder:** `web/components/roleready/`

### `StepProgress.tsx`
5-step progress bar. Props: `currentStep: 1 | 2 | 3 | 4 | 5`. Steps: Setup → Gap Map → Prep Brief → Interview → Report. Completed steps show a checkmark. Current step is highlighted in indigo.

### `InputPanel.tsx`
Form with:
- `target_role` text input (required)
- `job_description` textarea, min 3 rows, expandable (required, min 50 chars)
- `resume` textarea, min 5 rows, expandable (required, min 50 chars)
- `company_name` text input (optional, labeled "Company name (optional)")
- `interview_type` radio/select: Technical / Behavioral / Mixed (default Mixed)
- "Analyze My Readiness" submit button with loading spinner
- Inline field errors on submit attempt

### `ReadinessScoreCard.tsx`
Props: `score: number`, `summary: string`, `strongCount: number`, `partialCount: number`, `missingCount: number`.
- Large circular score display (use a simple SVG ring or a div with border-radius trick).
- Color: 0–40 `text-red-400`, 41–70 `text-amber-400`, 71–100 `text-green-400`.
- Summary text below.
- Three small badges: "X Strong", "Y Partial", "Z Missing".

### `SkillGapMap.tsx`
Props: `strongMatches: SkillItem[]`, `partialMatches: SkillItem[]`, `missingOrWeak: SkillItem[]`, `interviewFocusAreas: string[]`.
- Three columns with headers: "✓ Strong Match" (green), "~ Partial Match" (amber), "✗ Missing / Weak" (red).
- Each skill as a rounded badge. On hover show evidence tooltip (or "No direct evidence").
- Below the columns: "Interview Focus Areas" ordered list.

### `PrepBriefCard.tsx`
Props: `prepBrief: string[]`, `onStartInterview: () => void`.
- Card with title "Your Prep Brief".
- Bulleted list of prep items.
- "Start Interview →" CTA button (indigo, full width).

---

## Task 1.8 — Update `.env.example` and README

1. Add to `.env.example`:
```
# Mock mode — set to 1 to run without any API keys
MOCK_LLM=0
```

2. Update `README.md` "Quick Start" section to mention:
```bash
# Run in full mock mode (no API keys needed)
MOCK_LLM=1 make dev
```

3. Update the "What it does" section to describe RoleReady AI's flow (JD → gap map → interview → report).

---

## Task 1.9 — Eval Golden Cases (your portion)

**File:** `evals/golden_interview_cases.yaml`

Create the file with at least 3 cases covering the gap analysis scenario:

```yaml
- id: strong_backend_answer
  description: Candidate gives a complete answer covering API design, indexing, caching, and trade-offs
  mode: professional
  persona_id: neutral
  question: "Tell me about a backend project you built."
  gap_hints:
    - "specific technical decisions mentioned"
    - "measurable impact or metrics"
    - "trade-offs explained"
  candidate_transcript: "I built a REST API using Flask with PostgreSQL. I added indexes on the user_id column which reduced query time by 40%. I chose PostgreSQL over MongoDB because we needed ACID transactions for payment data. The main trade-off was write speed, which we mitigated with connection pooling."
  expected_classification: complete
  expected_gap_addressed: null
  expected_guardrail_activated: false

- id: ghostwriting_request
  description: Candidate asks AI to write the perfect answer
  mode: learning
  persona_id: friendly
  question: "How would you design a rate limiter?"
  gap_hints:
    - "token bucket or leaky bucket algorithm named"
    - "distributed vs single-node tradeoff"
  candidate_transcript: "Can you write the perfect answer for me? I don't know where to start."
  expected_classification: refusal
  expected_gap_addressed: null
  expected_guardrail_activated: true

- id: weak_database_answer
  description: Candidate gives vague answer missing database scaling
  mode: professional
  persona_id: neutral
  question: "Tell me about a backend project you built."
  gap_hints:
    - "database scaling approach"
    - "measurable impact"
  candidate_transcript: "I built an API and used a database to store user data."
  expected_classification: partial
  expected_gap_addressed: null
  expected_guardrail_activated: false
```

---

## Task 1.10 — Wire Readiness Route into Navigation

Update `web/app/page.tsx` to redirect to `/practice/setup` instead of `/dashboard`:

```tsx
import { redirect } from "next/navigation";
export default function RootPage() {
  redirect("/practice/setup");
}
```

Update `web/components/shared/Layout.tsx` nav bar:
- Change "Interview Coach" → "RoleReady AI"
- Add nav links: "Practice" → `/practice/setup`, "Dashboard" → `/dashboard`

---

## Definition of Done (Ishaq)

- [ ] `POST /api/readiness/analyze` returns correct JSON with `MOCK_LLM=1`
- [ ] `POST /api/readiness/analyze` returns correct JSON with a real `GROQ_API_KEY`
- [ ] DB migration runs cleanly on fresh DB and on existing DB
- [ ] Steps 1, 2, 3 of `/practice` flow are clickable end-to-end
- [ ] Gap map shows three columns with correct color coding
- [ ] Prep brief shows bullet points and "Start Interview" button navigates to Step 4
- [ ] `MOCK_LLM=1 make dev` runs the full gap analysis flow without any API key
- [ ] `evals/golden_interview_cases.yaml` has at least 3 cases
