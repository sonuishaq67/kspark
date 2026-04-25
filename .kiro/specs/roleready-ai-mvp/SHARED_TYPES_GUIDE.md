# Shared TypeScript Types Guide

**File:** `web/lib/types.ts`  
**Purpose:** Central location for all TypeScript type definitions used across the RoleReady AI frontend

---

## Usage

Import types in your components:

```typescript
import { 
  ReadinessAnalysisResponse, 
  TurnResponse, 
  FinishSessionResponse 
} from '@/lib/types';
```

---

## Type Ownership

| Type | Owner | Used By |
|------|-------|---------|
| `ReadinessAnalysisResponse` | Ishaq | Gap Map, Prep Brief pages |
| `SkillItem` | Ishaq | Gap Map components |
| `TurnResponse` | Shivam | InterviewRoom component |
| `SessionStateSnapshot` | Shivam | LiveGapPanel component |
| `FinishSessionResponse` | Varad | Report page |
| `GapReportItem` | Varad | Report components |
| `ReportScores` | Varad | ScoreCard component |
| `SessionListItem` | Shared | Dashboard, SessionCard |

---

## Adding New Types

When you need to add a new type:

1. Add it to the appropriate section in `web/lib/types.ts`
2. Add a comment explaining what it's for
3. Update this guide with the new type

Example:

```typescript
// ===== Varad's Types: Reporting & Dashboard =====

/**
 * Response from POST /api/sessions/{id}/finish
 * Used by: Report page, Dashboard
 */
export interface FinishSessionResponse {
  report_id: string
  session_id: string
  // ... rest of fields
}
```

---

## Type Sections

### Ishaq's Section: Gap Analysis
- `ReadinessAnalysisResponse` — Response from `/api/readiness/analyze`
- `SkillItem` — Individual skill with evidence and category

### Shivam's Section: Interview Orchestrator
- `CreateSessionRequest` — Request to create interview session
- `ReadinessAnalysisInput` — Gap analysis data passed to session
- `TurnRequest` — User message submission
- `TurnResponse` — AI response with gap tracking
- `SessionStateSnapshot` — Current session state

### Varad's Section: Reporting & Dashboard
- `FinishSessionResponse` — Full report data
- `GapReportItem` — Gap with status (open/improved/closed)
- `ReportScores` — 5 dimension scores (0-10 each)
- `FollowUpAnalysisItem` — Follow-up question analysis
- `ReportResponse` — Extended report with metadata

### Shared Section
- `SessionListItem` — Session in dashboard list
- `SessionMetaResponse` — Session metadata

---

## Best Practices

1. **Use exact types from backend** — Match Pydantic models exactly
2. **Add JSDoc comments** — Explain what each type is for
3. **Use union types** — For status fields like `"open" | "improved" | "closed"`
4. **Make optional fields explicit** — Use `?` for optional fields
5. **Group related types** — Keep types for the same feature together

---

## Example Usage

### In a Component

```typescript
import { FinishSessionResponse, GapReportItem } from '@/lib/types';

interface ReportPageProps {
  sessionId: string
}

export default function ReportPage({ sessionId }: ReportPageProps) {
  const [report, setReport] = useState<FinishSessionResponse | null>(null);
  
  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/report`)
      .then(res => res.json())
      .then((data: FinishSessionResponse) => setReport(data));
  }, [sessionId]);
  
  return (
    <div>
      {report?.gaps.map((gap: GapReportItem) => (
        <div key={gap.label}>{gap.label}: {gap.status}</div>
      ))}
    </div>
  );
}
```

### In API Client

```typescript
import { FinishSessionResponse } from '@/lib/types';

export async function finishSession(sessionId: string): Promise<FinishSessionResponse> {
  const response = await fetch(`/api/sessions/${sessionId}/finish`, {
    method: 'POST',
  });
  return response.json();
}
```

---

## Coordination

If you need to change a type that affects another person's work:

1. Post in #roleready-mvp Slack channel
2. Tag the affected person
3. Wait for acknowledgment before merging
4. Update coordination docs if needed

---

## Type Validation

TypeScript will catch type mismatches at compile time:

```bash
cd web
npm run build  # Will fail if types don't match
```

Always run `npm run build` before committing to catch type errors early.
