# Coordination Document: Varad ↔ Shivam

**Date:** Day 0  
**Purpose:** Agree on API contracts and session state structure

---

## 1. API Contract: `FinishSessionResponse`

### Endpoint: `POST /api/sessions/{session_id}/finish`

**Owner:** Varad implements this endpoint  
**Consumer:** Shivam's InterviewRoom calls this endpoint

**Response Shape (TypeScript):**
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
  role_alignment: number        // 0-10
  technical_clarity: number     // 0-10
  communication: number         // 0-10
  evidence_strength: number     // 0-10
  followup_recovery: number     // 0-10
}

interface FollowUpAnalysisItem {
  question: string
  reason: string
  candidate_response_quality: "strong" | "partial" | "weak"
}
```

**Python (Pydantic):**
```python
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

class FinishSessionResponse(BaseModel):
    report_id: str
    session_id: str
    summary: str
    strengths: list[str]
    gaps: list[GapReportItem]
    scores: ReportScores
    follow_up_analysis: list[FollowUpAnalysisItem]
    next_practice_plan: list[str]
```

---

## 2. Session State Structure

### From: `TurnResponse.updated_session_state`

**Shivam provides this in turn responses.**  
**Varad needs this for report generation context.**

**Structure:**
```typescript
interface SessionStateSnapshot {
  current_gap_being_tested: string | null
  probe_count: number
  open_gaps: string[]
  closed_gaps: string[]
  guardrail_activations: number
  session_status: "active" | "ending" | "ended"
}
```

**Key Fields Varad Uses:**
- `open_gaps` — list of gap labels still not addressed
- `closed_gaps` — list of gap labels successfully covered
- `guardrail_activations` — count of ghostwriting attempts
- `session_status` — determines when "Finish Interview" button shows

---

## 3. When Does `session_status` Become "ending"?

**Shivam's Logic:**
- `session_status = "ending"` when:
  - All questions answered, OR
  - All gaps closed, OR
  - User manually ends session

**Varad's Dependency:**
- InterviewRoom shows "Finish Interview" button when `session_status === "ending"`
- Button calls `POST /api/sessions/{id}/finish` (Varad's endpoint)

---

## 4. Turn History Structure

**Varad needs full turn history for report generation.**

**Query:** `await queries.get_turns_for_session(session_id)`

**Turn Structure:**
```python
{
    "id": str,
    "session_id": str,
    "question_id": str,
    "speaker": "candidate" | "agent",
    "transcript": str,
    "classification": str | None,  # "complete", "partial", "stall", etc.
    "gap_addressed": str | None,   # gap label if addressed
    "probe_count": int,
    "created_at": str
}
```

**Varad Uses:**
- `speaker` — to separate candidate vs agent turns
- `transcript` — for evidence quotes in report
- `classification` — to understand turn quality
- `gap_addressed` — to track which gaps were covered

---

## 5. InterviewRoom Integration

### Shivam's InterviewRoom Component

**Location:** `web/app/practice/interview/page.tsx`

**On "Finish Interview" button click:**
```typescript
const handleFinish = async () => {
  setLoading(true);
  try {
    const response = await fetch(`/api/sessions/${sessionId}/finish`, {
      method: 'POST',
    });
    const data = await response.json();
    
    // Navigate to report page
    router.push(`/practice/report?session_id=${sessionId}`);
  } catch (error) {
    console.error('Failed to finish session:', error);
  } finally {
    setLoading(false);
  }
};
```

**Varad's Endpoint Must:**
- Return 200 with `FinishSessionResponse`
- Return 422 if no turns exist
- Return 404 if session not found
- Be idempotent (calling twice returns same report)

---

## 6. Error Handling Agreement

### Scenario: No Turns in Session

**Shivam:** Prevents "Finish" button from showing if no turns  
**Varad:** Returns HTTP 422 if called anyway

```python
if len(turns) == 0:
    raise HTTPException(422, detail="No turns to analyze")
```

### Scenario: Session Not Found

**Varad:** Returns HTTP 404

```python
if not session:
    raise HTTPException(404, detail="Session not found")
```

### Scenario: Report Already Exists

**Varad:** Returns existing report (idempotent)

```python
existing_report = await get_report(session_id)
if existing_report:
    return existing_report  # Don't regenerate
```

---

## 7. Action Items

### For Shivam:
- [ ] Implement "Finish Interview" button in InterviewRoom
- [ ] Button shows when `session_status === "ending"`
- [ ] Button calls `POST /api/sessions/{id}/finish`
- [ ] Navigate to `/practice/report?session_id={id}` on success
- [ ] Handle loading and error states
- [ ] Confirm `TurnResponse.updated_session_state` structure matches above

### For Varad:
- [ ] Implement `POST /api/sessions/{id}/finish` endpoint
- [ ] Return `FinishSessionResponse` matching the shape above
- [ ] Handle all error cases (404, 422, 500)
- [ ] Make endpoint idempotent
- [ ] Test with Shivam's InterviewRoom

---

## 8. Testing Integration

### Test Scenario 1: Happy Path
1. Shivam: Complete an interview (3+ turns)
2. Shivam: Click "Finish Interview"
3. Varad: Endpoint generates report
4. Varad: Report page renders correctly

### Test Scenario 2: Idempotency
1. Call `/finish` twice
2. Second call returns same report
3. No duplicate reports in DB

### Test Scenario 3: Error Handling
1. Try to finish session with 0 turns → 422
2. Try to finish non-existent session → 404
3. LLM fails → 500 with error message

---

## 9. Communication

**Slack/Discord Channel:** #roleready-mvp

**Questions for Shivam:**
1. When will InterviewRoom "Finish" button be ready?
2. Can you confirm `session_status` transition logic?
3. Any changes to `TurnResponse` structure?

**Questions for Varad:**
1. When will `/finish` endpoint be ready?
2. Can you confirm error response formats?
3. Any changes to `FinishSessionResponse` structure?

**Estimated Timeline:**
- Shivam implements button: Day 2
- Varad implements endpoint: Day 1
- Integration testing: Day 2 afternoon

---

## 10. Mock Mode Testing

**Test Command:**
```bash
MOCK_LLM=1 uvicorn main:app --reload --port 8000
```

**Expected Flow:**
1. Complete interview with mock responses
2. Click "Finish Interview"
3. Varad's endpoint returns mock report data
4. Report page renders all sections
5. No API key needed

---

**Status:** ✅ Contract agreed  
**Next Steps:** Both can implement independently, integrate on Day 2

---

## 11. Frontend Type Definitions

**Varad will add to `web/lib/api.ts`:**

```typescript
export interface FinishSessionResponse {
  report_id: string
  session_id: string
  summary: string
  strengths: string[]
  gaps: GapReportItem[]
  scores: ReportScores
  follow_up_analysis: FollowUpAnalysisItem[]
  next_practice_plan: string[]
}

export interface GapReportItem {
  label: string
  status: "open" | "improved" | "closed"
  evidence: string | null
}

export interface ReportScores {
  role_alignment: number
  technical_clarity: number
  communication: number
  evidence_strength: number
  followup_recovery: number
}

export interface FollowUpAnalysisItem {
  question: string
  reason: string
  candidate_response_quality: "strong" | "partial" | "weak"
}
```

**Shivam can import these types when calling the endpoint.**
