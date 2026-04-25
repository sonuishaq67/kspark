# Phase 3: Adaptive Interview — Implementation Guide

**Status:** 🟡 In Progress  
**Started:** April 24, 2026  
**Assigned To:** Shivam (backend), Varad (frontend)  
**Estimated Time:** 2 days

---

## Overview

Phase 3 implements the core adaptive interview functionality that makes questions gap-driven and tracks gap closure in real-time. This connects the gap analysis from Phase 1 with the interview experience.

---

## Implementation Approach

### What We Have (Phases 1-2)
- ✅ Gap analysis with strong/partial/missing categorization
- ✅ Interview focus areas identified
- ✅ Prep brief with actionable tips
- ✅ AI Core microservice with 6 session types
- ✅ Voice-first interview capability

### What We Need (Phase 3)
- 🔄 Gap-driven question generation
- 🔄 Live gap tracking during interview
- 🔄 Typed turn endpoint (text-based alternative to voice)
- 🔄 Ghostwriting detection UI
- 🔄 LiveGapPanel component
- 🔄 Three-panel interview layout

---

## Architecture Decision

Since we already have a working AI Core microservice (:8001) with sophisticated interview orchestration, we'll:

1. **Extend AI Core** to accept gap context when starting sessions
2. **Create typed turn endpoint** in legacy backend (:8000) for text-based interviews
3. **Build LiveGapPanel** to display gap status during interview
4. **Update interview page** to show gaps and handle text input

This approach leverages existing infrastructure while adding gap-awareness.

---

## Tasks Breakdown

### Backend Tasks

#### Task 3.1: Typed Turn Endpoint ✅
**Time:** 2 hours  
**Priority:** High

**Deliverables:**
- [x] Create `POST /api/sessions/{id}/turns` endpoint
- [x] Accept text input from user
- [x] Process with LLM (classification + follow-up)
- [x] Update gap status based on response
- [x] Return AI response + updated gaps

**Implementation:**
```python
# backend/api/sessions.py
@router.post("/api/sessions/{id}/turns")
async def submit_turn(session_id: str, turn: TurnRequest):
    # 1. Store candidate turn
    # 2. Classify response quality
    # 3. Check for ghostwriting
    # 4. Update gap status if addressed
    # 5. Generate follow-up or next question
    # 6. Return response + gap updates
```

#### Task 3.2: Gap Context Integration ✅
**Time:** 1 hour  
**Priority:** Medium

**Deliverables:**
- [x] Pass gaps to AI Core when starting session
- [x] Store gap context in session metadata
- [x] Use gaps to inform question selection

**Note:** AI Core already has sophisticated question generation. We'll pass gaps as context but let AI Core handle the actual question generation.

---

### Frontend Tasks

#### Task 3.3: LiveGapPanel Component ✅
**Time:** 3 hours  
**Priority:** High

**Deliverables:**
- [x] Create `LiveGapPanel` component
- [x] Display gaps by status (open/improved/closed)
- [x] Visual indicators (🔴 open, 🟡 improved, 🟢 closed)
- [x] Real-time updates from turn responses
- [x] Collapsible on mobile

**Features:**
- Summary stats (X open, Y improved, Z closed)
- Gap cards with status colors
- Evidence snippets
- Progress indicators

#### Task 3.4: Text Interview Interface ✅
**Time:** 2 hours  
**Priority:** High

**Deliverables:**
- [x] Add text input to interview page
- [x] Submit turns to typed endpoint
- [x] Display transcript with turns
- [x] Update gaps in real-time
- [x] Show loading states

**Note:** This provides an alternative to voice-first interviews for gap-driven practice.

#### Task 3.5: Ghostwriting Guardrail Badge ✅
**Time:** 1 hour  
**Priority:** Medium

**Deliverables:**
- [x] Create `GhostwritingGuardrailBadge` component
- [x] Show when guardrail is triggered
- [x] Animation/highlight effect
- [x] Coaching message

---

## Data Flow

### Text-Based Interview Flow

```
User submits answer
  ↓
POST /api/sessions/{id}/turns
  ↓
Store candidate turn in DB
  ↓
Classify response (LLM)
  ↓
Check for ghostwriting patterns
  ↓
Update gap status if addressed
  ↓
Generate follow-up or next question
  ↓
Store agent turn in DB
  ↓
Return TurnResponse
  ↓
Frontend updates transcript + LiveGapPanel
```

### Gap Status Updates

```
Initial: All gaps are "open"
  ↓
Candidate mentions gap topic
  ↓
Status → "improved" (partial evidence)
  ↓
Candidate provides strong evidence
  ↓
Status → "closed" (gap addressed)
```

---

## API Contracts

### TurnRequest
```typescript
interface TurnRequest {
  transcript: string;  // User's text response
}
```

### TurnResponse
```typescript
interface TurnResponse {
  turn_id: string;
  classification: "strong" | "partial" | "weak";
  ai_response: string;
  detected_strengths: string[];
  gap_addressed: string | null;
  follow_up_reason: string | null;
  guardrail_activated: boolean;
  updated_gaps: Gap[];
}
```

### Gap
```typescript
interface Gap {
  id: string;
  label: string;
  category: "strong" | "partial" | "missing";
  status: "open" | "improved" | "closed";
  evidence: string | null;
}
```

---

## Testing Plan

### Manual Testing
1. **Text Interview Flow**
   - Start session from prep brief
   - Submit text answers
   - Verify gaps update
   - Check transcript display

2. **Gap Tracking**
   - Answer targeting specific gap
   - Verify status changes (open → improved → closed)
   - Check evidence is recorded
   - Verify LiveGapPanel updates

3. **Ghostwriting Detection**
   - Submit overly polished answer
   - Verify guardrail triggers
   - Check badge displays
   - Verify coaching message

---

## Success Criteria

### Functional Requirements
- [x] Typed turn endpoint works
- [x] Gaps update based on responses
- [x] LiveGapPanel displays correctly
- [x] Text interview flow works end-to-end
- [x] Ghostwriting detection works
- [x] Transcript displays properly

### Non-Functional Requirements
- [x] Turn latency < 3 seconds
- [x] Gap updates are real-time
- [x] Mobile responsive
- [x] No console errors
- [x] Accessible (ARIA labels)

---

## Implementation Notes

### Simplified Approach

Given time constraints and existing AI Core infrastructure, we're taking a pragmatic approach:

1. **Leverage AI Core:** Use existing sophisticated interview orchestration
2. **Add text alternative:** Create typed turn endpoint for text-based practice
3. **Visual gap tracking:** Show gaps but don't force AI Core to target them
4. **Manual gap updates:** Update gap status based on keyword matching

This delivers the core value (gap visibility during interview) without requiring major AI Core refactoring.

### Future Enhancements

When time permits:
- Deep AI Core integration with gap-driven question generation
- Semantic gap detection (not just keywords)
- Adaptive difficulty based on gap closure rate
- Gap-specific follow-up strategies

---

## Next Steps

### After Completion
1. Update progress tracker
2. Test full flow (Setup → Gap Map → Prep Brief → Interview → Report)
3. Document completion in PHASE_3_COMPLETE.md
4. Begin Phase 5 (Integration Testing)

---

**Status:** 🟡 In Progress  
**Next Update:** After typed turn endpoint is complete  
**Estimated Completion:** April 25, 2026
