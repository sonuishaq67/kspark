# Coordination Document: Varad ↔ Ishaq

**Date:** Day 0  
**Purpose:** Agree on shared interfaces and mock data structure

---

## 1. Mock Responses Structure

### File: `backend/llm/mock_responses.py`

**Status:** File does NOT exist yet — Ishaq needs to create it

**Required Structure:**
```python
"""
Mock LLM responses for demo mode (MOCK_LLM=1).
Used when GROQ_API_KEY is absent or MOCK_LLM=1 is set.
"""

MOCK_RESPONSES = {
    "readiness_analysis": {
        # Ishaq's mock data for gap analysis
        # (Ishaq owns this)
    },
    
    "turn_classifier": {
        # Shivam's mock data for turn classification
        # (Shivam owns this)
    },
    
    "followup_generator": {
        # Shivam's mock data for follow-up questions
        # (Shivam owns this)
    },
    
    "report_generator": {
        # Varad's mock data for report generation
        # (Varad owns this - see below)
    },
}
```

---

## 2. Varad's Mock Report Data

**Varad will add this to `MOCK_RESPONSES["report_generator"]`:**

```python
"report_generator": {
    "summary": "You showed strong API understanding and project ownership. Your main improvement areas are database reasoning, scaling trade-offs, and measurable impact. The follow-up on 10x traffic revealed a gap in horizontal scaling strategy that is worth focused practice.",
    "strengths": [
        "Clear project ownership — you described your specific role and decisions.",
        "Good API-level thinking — you explained REST design choices confidently.",
        "Strong communication structure — answers were organized and easy to follow."
    ],
    "gaps": [
        {
            "label": "Database scaling",
            "status": "open",
            "evidence": "Did not address horizontal scaling or sharding when asked about 10x traffic."
        },
        {
            "label": "Metrics / measurable impact",
            "status": "improved",
            "evidence": "After probing, mentioned 40% query improvement but lacked baseline comparison."
        },
        {
            "label": "System design trade-offs",
            "status": "open",
            "evidence": "Trade-offs were mentioned but not explained with specific reasoning."
        }
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

## 3. Demo Scenario Agreement

**Scenario:** Backend Engineer Intern at Acme Corp

**Key Data Points:**
- **Target Role:** "Backend Engineer Intern"
- **Company:** "Acme Corp"
- **Interview Type:** "mixed" (technical + behavioral)
- **Readiness Score:** 58 / 100
- **Strong Skills:** Python, REST APIs, Git, Team project
- **Partial Skills:** SQL, Authentication, Cloud basics
- **Missing Skills:** Database scaling, Production debugging, Metrics/measurable impact, System design trade-offs

**This scenario must be consistent across:**
- Ishaq's gap analysis mock response
- Shivam's interview questions
- Varad's report mock response

---

## 4. Database Schema: `reports` Table

**File:** `database/migrations/002_roleready_extensions.sql`

**Ishaq owns this migration file.**

**Required schema for Varad's work:**

```sql
CREATE TABLE IF NOT EXISTS reports (
    id              TEXT PRIMARY KEY,
    session_id      TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    summary         TEXT NOT NULL,
    strengths_json  TEXT NOT NULL,   -- JSON array of strings
    gaps_json       TEXT NOT NULL,   -- JSON array of GapReportItem objects
    scores_json     TEXT NOT NULL,   -- JSON object with 5 scores
    followup_json   TEXT NOT NULL,   -- JSON array of FollowUpAnalysisItem objects
    next_steps_json TEXT NOT NULL,   -- JSON array of strings
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reports_session ON reports(session_id);
```

**Varad needs:**
- `reports` table to exist before implementing Task 3.3 (Report Generation Endpoint)
- Confirm column names match exactly (especially the `_json` suffix pattern)

---

## 5. Action Items

### For Ishaq:
- [ ] Create `backend/llm/mock_responses.py` with the structure above
- [ ] Add your `readiness_analysis` mock data
- [ ] Create migration `002_roleready_extensions.sql` with `reports` table
- [ ] Confirm demo scenario data matches above
- [ ] Notify Varad when file is ready

### For Varad:
- [ ] Wait for Ishaq to create `mock_responses.py`
- [ ] Add `report_generator` mock data to the file
- [ ] Verify `reports` table schema matches your query functions
- [ ] Proceed with Task 3.1 (Report Generator Prompt) independently

---

## 6. Communication

**Slack/Discord Channel:** #roleready-mvp

**Questions for Ishaq:**
1. When will `mock_responses.py` be ready?
2. When will migration `002_roleready_extensions.sql` be committed?
3. Any changes to the demo scenario data?

**Estimated Timeline:**
- Ishaq creates files: Day 1 morning
- Varad adds mock data: Day 1 afternoon
- Both can work in parallel on other tasks

---

## 7. Testing Integration

**Test Command:**
```bash
MOCK_LLM=1 uvicorn main:app --reload --port 8000
```

**Expected Behavior:**
- Gap analysis returns Ishaq's mock data
- Report generation returns Varad's mock data
- No GROQ_API_KEY needed
- Full flow works end-to-end

---

**Status:** ⏳ Waiting for Ishaq to create `mock_responses.py`

**Next Steps:** Varad can proceed with Task 3.1 (prompt writing) independently while waiting.
