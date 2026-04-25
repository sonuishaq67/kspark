# RoleReady AI — Task Master Index

Three independent workstreams. Each person owns their slice end-to-end.
No merge conflicts if ownership rules are followed.

| Person | Workstream | Task File |
|--------|-----------|-----------|
| Ishaq | JD/Resume Gap Engine + Research Microservice | `tasks-ishaq.md` |
| Shivam | Adaptive Interview Loop (Orchestrator) | `tasks-shivam.md` |
| Varad | Dashboard, Reporting & Landing Page | `tasks-varad.md` |

## Shared Contracts (Agree Before Building)

### API Contract: Ishaq → Shivam
Ishaq's `/api/readiness/analyze` response is the input to Shivam's session creation.
Shape locked in `design.md` § Workstream 1 → `ReadinessAnalysisResponse`.

### API Contract: Shivam → Varad
Shivam's `POST /api/sessions/{id}/finish` and `GET /api/sessions/{id}/report` feed Varad's report UI.
Shape locked in `design.md` § Workstream 3 → `FinishSessionResponse`.

### DB Contract: Ishaq owns migrations
Ishaq writes `database/migrations/002_roleready_extensions.sql`.
Shivam and Varad read from the tables Ishaq creates — never write migrations themselves.

## Sync Points

| When | What | Who |
|------|------|-----|
| Day 1 start | Agree on API shapes above | All 3 |
| After Ishaq Task 1.3 | DB migration is live — Shivam can start gap-driven sessions | Ishaq → Shivam |
| After Shivam Task 2.4 | `/finish` endpoint is live — Varad can build report UI | Shivam → Varad |
| Final | Integration smoke test: full flow analyze → interview → report | All 3 |
