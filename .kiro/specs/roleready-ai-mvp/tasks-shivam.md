# Shivam — Adaptive Interview Orchestrator Microservice

**Workstream:** Gap-driven session creation, typed turn endpoint, sub-agent orchestration, ghostwriting guardrail, InterviewRoom UI (Step 4).

**Spec refs:** Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 4.2 (backward compat), 4.3 (responsible AI)

**Your folders:**
- `backend/orchestrator/` — extend existing state machine
- `backend/api/sessions.py` — extend existing session routes
- `prompts/turn_classifier.md` — new prompt (replaces classify_turn.md)
- `prompts/followup_generator.md` — new prompt (replaces generate_probe.md)
- `prompts/guardrail.md` — new prompt (replaces scaffold_refusal.md)
- `web/app/practice/interview/page.tsx` — Step 4 page
- `web/components/roleready/InterviewRoom.tsx`
- `web/components/roleready/TranscriptBubble.tsx`
- `web/components/roleready/LiveGapPanel.tsx`
- `web/components/roleready/GhostwritingGuardrailBadge.tsx`

**Do NOT touch:** `backend/api/readiness.py`, `backend/db/schema.sql`, `web/app/practice/setup/`, `web/app/practice/gap-map/`, `web/app/practice/prep-brief/`, `web/app/dashboard/`, `web/app/report/`

**Depends on:** Ishaq's Task 1.1 (DB migration) and Task 1.2 (mock mode) before you can test gap-driven sessions.

---

## Task 2.1 — Extend SessionState for Gap Context

**File:** `backend/orchestrator/state.py`

Add new fields to `SessionState` dataclass:

```python
@dataclass
class SessionState:
    # ... all existing fields unchanged ...

    # RoleReady additions
    target_role: str | None = None
    interview_type: str | None = None
    gap_context: list[dict] = field(default_factory=list)
    # Each item: {"label": str, "category": "strong"|"partial"|"missing", "evidence": str|None}

    current_gap_being_tested: str | None = None
    open_gaps: list[str] = field(default_factory=list)
    # Labels of missing/partial gaps not yet closed

    closed_gaps: list[str] = field(default_factory=list)
    # Labels of gaps marked complete

    guardrail_activations: int = 0
    interview_focus_areas: list[str] = field(default_factory=list)
    # Ordered list from readiness analysis
```

No changes to existing fields. Existing sessions without these fields default to empty/None.

---

## Task 2.2 — Gap-Driven Question Generator

**File:** `backend/orchestrator/session_manager.py`

Add a new function `generate_gap_questions(gap_context, interview_focus_areas, interview_type, target_role)` that:

1. Takes the gap context from readiness analysis.
2. Generates 4–6 `Question` objects targeting `missing` and `partial` gaps, ordered by `interview_focus_areas` priority.
3. Uses the Groq LLM (or mock) to generate question text. Prompt:

```
Given these interview focus areas: {focus_areas}
And these skill gaps: {missing_and_partial_gaps}
Generate {n} interview questions for a {interview_type} interview for a {target_role} role.
Each question should probe one specific gap. Return JSON array:
[{"id": "q1", "text": "...", "topic": "...", "gap_hints": ["hint1", "hint2", "hint3"]}]
```

4. In mock mode: return hardcoded questions for the Backend Engineer Intern scenario:
```python
MOCK_QUESTIONS = [
    Question(id="q1", text="Tell me about a backend project you built. Walk me through the architecture.", topic="backend_project", gap_hints=["specific technical decisions", "database choice and reasoning", "measurable impact or metrics"]),
    Question(id="q2", text="How would you design a system to handle 10x the current traffic?", topic="system_scaling", gap_hints=["horizontal vs vertical scaling", "database scaling strategy", "caching approach"]),
    Question(id="q3", text="Describe a time you had to debug a production issue.", topic="production_debugging", gap_hints=["systematic debugging approach", "tools used", "root cause identified"]),
    Question(id="q4", text="How do you measure the success of a feature you shipped?", topic="measurable_impact", gap_hints=["specific metrics tracked", "before/after comparison", "business impact"]),
]
```

Extend `start_session` to accept `readiness_analysis` dict and call `generate_gap_questions` when provided. Initialize `open_gaps` from `missing_or_weak` labels.

---

## Task 2.3 — New Prompt Files

### `prompts/turn_classifier.md`

Extends the existing `classify_turn.md` with gap-awareness. The prompt must instruct the model to return JSON:

```json
{
  "kind": "complete | partial | clarify | stall",
  "gap_addressed": "label of gap addressed, or null",
  "detected_strengths": ["list of skills demonstrated"],
  "follow_up_reason": "one sentence explaining why a follow-up is needed, or null if complete"
}
```

Include explicit instruction: **"Do not suggest or write answers for the candidate. Classify only."**

### `prompts/followup_generator.md`

Extends `generate_probe.md`. The prompt receives: question text, target gap, conversation history, follow_up_reason, persona fragment. Returns a single focused follow-up question as plain text. Must include: **"Do not give hints that reveal the answer. Ask a question that makes the candidate think."**

### `prompts/guardrail.md`

Replaces `scaffold_refusal.md`. Mode-aware refusal prompt. Must produce:
- Learning mode: warm refusal + Socratic nudge + STAR structure suggestion
- Professional mode: curt refusal, no explanation

Required response pattern (learning mode):
```
I can't write a perfect answer for you to memorize, because that would not help you build interview skill. I can help you structure your own answer using your real experience.

Try this structure:
1. Situation — what was the context?
2. Your specific role — what were you responsible for?
3. Technical decision — what did you choose and why?
4. Trade-off — what did you give up?
5. Result — what happened?

Now tell me your own version, and I'll help you improve it.
```

---

## Task 2.4 — Typed Turn Endpoint

**File:** `backend/api/sessions.py` (extend existing)

Add `POST /api/sessions/{session_id}/turns`:

**Request model:**
```python
class TurnRequest(BaseModel):
    user_message: str = Field(min_length=1, max_length=4000)
```

**Response model:**
```python
class TurnResponse(BaseModel):
    turn_id: str
    classification: str
    ai_response: str
    detected_strengths: list[str]
    missing_gap: str | None
    follow_up_reason: str | None
    guardrail_activated: bool
    updated_session_state: SessionStateSnapshot

class SessionStateSnapshot(BaseModel):
    current_gap_being_tested: str | None
    probe_count: int
    open_gaps: list[str]
    closed_gaps: list[str]
    guardrail_activations: int
    session_status: str  # "active" | "ending" | "ended"
```

**Logic:**
1. Load session from in-process store. Return 404 if not found, 409 if already ended.
2. Call `process_turn(session_id, user_message)` — reuse existing session manager function.
3. After processing, build `SessionStateSnapshot` from updated session state.
4. Set `session_status = "ending"` when all questions answered or all gaps closed.
5. Persist both turns to DB (already done in `process_turn`).
6. Update `gaps` table: when `gap_addressed` is set, update that gap's `status` to `improved` or `closed`.
7. Return `TurnResponse`.

**Error handling:**
- 404: session not found
- 409: session already ended (`state == ENDED`)
- 500: LLM failure (return `{"detail": "AI unavailable, please retry"}`)

---

## Task 2.5 — Extend Sub-Agent for Gap Context

**File:** `backend/orchestrator/sub_agent.py`

Extend `run_turn` to:

1. Use `prompts/turn_classifier.md` instead of `classify_turn.md` (rename the prompt key).
2. Use `prompts/followup_generator.md` instead of `generate_probe.md`.
3. Use `prompts/guardrail.md` instead of `scaffold_refusal.md`.
4. Return `detected_strengths` and `follow_up_reason` in `SubAgentResponse`:

```python
@dataclass
class SubAgentResponse:
    action: str
    utterance: str
    gap_addressed: str | None = None
    classification: str | None = None
    detected_strengths: list[str] = field(default_factory=list)  # NEW
    follow_up_reason: str | None = None                           # NEW
```

5. When selecting the probe target gap, use `session.interview_focus_areas` order (highest priority first) instead of just `open_gaps[0]`.

6. Extend ghostwriting regex to cover all patterns from Requirement 2.3:
```python
_GHOSTWRITE_PATTERNS = [
    r"just tell me what to say",
    r"give me (the |a |an )?answer",
    r"what should i say",
    r"write (it|this|me) (for me|out|up)",
    r"tell me (the |a )?answer",
    r"give me (a |the )?sample",
    r"give me (a |the )?template",
    r"can you (just )?answer (this|it|for me)",
    r"write (the |a )?perfect answer",
    r"give me a script",
    r"memorize your answer",
    r"answer this (interview )?question for me",
]
```

---

## Task 2.6 — Extend Session Manager for Gap Tracking

**File:** `backend/orchestrator/session_manager.py`

Extend `process_turn` to:

1. After sub-agent returns, update `session.current_gap_being_tested` to the gap being probed.
2. When `gap_addressed` is set and action is `advance`, move that gap from `open_gaps` to `closed_gaps`.
3. Increment `session.guardrail_activations` when action is `refuse`.
4. Determine `session_status`:
   - `"active"` — questions remain and gaps remain open
   - `"ending"` — all questions answered OR all open gaps closed
   - `"ended"` — session state is `ENDED`

Also extend `start_session` to accept and store `readiness_analysis` dict, call `generate_gap_questions`, and initialize `open_gaps`.

---

## Task 2.7 — Extend `POST /api/sessions` for Readiness Input

**File:** `backend/api/sessions.py`

Extend the existing `POST /api/sessions` request model:

```python
class ReadinessAnalysisInput(BaseModel):
    session_id: str
    strong_matches: list[dict]
    partial_matches: list[dict]
    missing_or_weak: list[dict]
    interview_focus_areas: list[str]
    target_role: str
    interview_type: str

class CreateSessionRequest(BaseModel):
    mode: str = "professional"
    persona_id: str = "neutral"
    readiness_analysis: ReadinessAnalysisInput | None = None  # NEW — optional
```

When `readiness_analysis` is provided:
- Pass it to `start_session`.
- The response `total_questions` reflects the generated question count (4–6).
- The response includes `target_role` and `interview_type`.

When absent: existing behavior unchanged (loads `demo_questions.yaml`, 3 questions).

---

## Task 2.8 — InterviewRoom UI (Step 4)

**File:** `web/app/practice/interview/page.tsx`

Client component. On mount:
1. Read `session_id` and `readiness_analysis` from `sessionStorage`.
2. Call `POST /api/sessions` with the readiness analysis to create the interview session.
3. Render `InterviewRoom` component.

On "Finish Interview":
1. Call `POST /api/sessions/{id}/finish` (Varad's endpoint — stub with a `fetch` call).
2. Navigate to `/practice/report?session_id={id}`.

---

## Task 2.9 — Frontend Components (Step 4)

**Folder:** `web/components/roleready/`

### `InterviewRoom.tsx`
Three-panel layout. Props: `sessionId: string`, `onFinish: () => void`.

```
┌──────────────────────────────────────────────────────────────────┐
│ Left (240px)       │ Center (flex)          │ Right (280px)      │
│                    │                        │                    │
│ Question 2 of 5    │ [Transcript bubbles]   │ LiveGapPanel       │
│ Focus: SQL Design  │                        │                    │
│ Gap: DB scaling    │ [Text input]           │                    │
│ Probes: 1/3        │ [Submit] [🎤 optional] │                    │
│ Status: Active     │                        │                    │
└──────────────────────────────────────────────────────────────────┘
```

State managed inside this component:
- `conversation: Message[]` — array of `{speaker, text, guardrailActivated, detectedStrengths, followUpReason}`
- `inputText: string`
- `isLoading: boolean`
- `sessionState: SessionStateSnapshot | null`

On submit:
1. Add candidate message to conversation.
2. Call `POST /api/sessions/{id}/turns`.
3. Add AI response to conversation.
4. Update `sessionState` from response.
5. Show "Finish Interview" button when `session_status === "ending"`.

Responsive: three-panel on ≥1024px, stacked on ≥768px.

### `TranscriptBubble.tsx`
Props: `speaker: "agent" | "candidate"`, `text: string`, `guardrailActivated?: boolean`, `detectedStrengths?: string[]`, `followUpReason?: string`.
- Agent: indigo-tinted background, left-aligned, small "AI" avatar.
- Candidate: gray background, right-aligned.
- When `guardrailActivated`: render `GhostwritingGuardrailBadge` below the bubble.

### `LiveGapPanel.tsx`
Props: `sessionState: SessionStateSnapshot | null`, `detectedStrength?: string`, `missingGap?: string`, `followUpReason?: string`.
- "Detected Strength" green chip (show last detected strength).
- "Gap Being Tested" amber chip (show `current_gap_being_tested`).
- "Why this follow-up" italic text (show `follow_up_reason`).
- "Open Gaps" list with amber dots.
- "Closed Gaps" list with green checkmarks.
- Probe count: "Probe {n} / 3".
- Empty state: "Start answering to see gap tracking."

### `GhostwritingGuardrailBadge.tsx`
Small inline badge: `🛡 Agency Guardrail Activated`.
Amber/orange background. Tooltip on hover: "The AI will not write answers for you. It will help you build your own."

---

## Task 2.10 — Mock Turn Responses

**File:** `backend/llm/mock_responses.py` (extend Ishaq's file)

Add mock responses for turn classification and follow-up generation:

```python
MOCK_RESPONSES["turn_classifier_partial"] = {
    "kind": "partial",
    "gap_addressed": None,
    "detected_strengths": ["Flask API development", "Python"],
    "follow_up_reason": "Candidate described the API but did not mention database scaling or how the system would handle increased load."
}

MOCK_RESPONSES["turn_classifier_complete"] = {
    "kind": "complete",
    "gap_addressed": "database scaling",
    "detected_strengths": ["database indexing", "caching strategy", "trade-off reasoning"],
    "follow_up_reason": None
}

MOCK_RESPONSES["followup_generator"] = "That's a good start. How would your system handle 10x the current traffic? Specifically, what would you change about your database setup?"

MOCK_RESPONSES["guardrail_learning"] = """I can't write a perfect answer for you to memorize, because that would not help you build interview skill. I can help you structure your own answer using your real experience.

Try this structure:
1. Situation — what was the context?
2. Your specific role — what were you responsible for?
3. Technical decision — what did you choose and why?
4. Trade-off — what did you give up?
5. Result — what happened?

Now tell me your own version, and I'll help you improve it."""
```

Coordinate with Ishaq on the file structure — he creates it, you extend it.

---

## Task 2.11 — Backward Compatibility Check

Verify these still work after your changes:
- `POST /api/sessions` without `readiness_analysis` → creates 3-question generic session
- `GET /api/sessions/{id}` → returns session metadata
- `POST /api/sessions/{id}/end` → generates TLDR (old endpoint)
- `/ws/interview/{session_id}` WebSocket → still connects and processes audio
- `/interview/new` → `/interview/{sessionId}` → `/report/{sessionId}` flow still navigates

Write a quick manual test checklist in a comment at the top of `backend/api/sessions.py`.

---

## Definition of Done (Shivam)

- [ ] `POST /api/sessions` with `readiness_analysis` generates gap-driven questions
- [ ] `POST /api/sessions/{id}/turns` returns `TurnResponse` with all fields
- [ ] Ghostwriting attempt returns `guardrail_activated: true` and a Socratic refusal
- [ ] Partial answer returns `classification: "partial"` and a targeted follow-up
- [ ] Complete answer returns `classification: "complete"` and advances the session
- [ ] `session_status` transitions to `"ending"` when all questions answered
- [ ] `LiveGapPanel` updates after each turn with correct gap/strength/reason
- [ ] `GhostwritingGuardrailBadge` appears inline in transcript on guardrail activation
- [ ] Three-panel InterviewRoom layout renders correctly on ≥1024px
- [ ] All existing `/interview/` routes still work (backward compat)
- [ ] `MOCK_LLM=1` runs the full interview flow without any API key
