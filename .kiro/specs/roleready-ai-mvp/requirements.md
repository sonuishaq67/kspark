# Requirements: RoleReady AI MVP

## Introduction

RoleReady AI is a hackathon MVP that extends the existing `interview-coach` application. It takes a candidate's resume and a job description, identifies readiness gaps, runs an adaptive mock interview targeting those gaps, and produces a learning-focused feedback report. The system must never ghostwrite answers for the candidate.

All requirements are organized by the three independent workstreams that can be built in parallel.

---

## Workstream 1: JD/Resume Gap Engine

### Requirement 1.1 — Readiness Analysis Endpoint

**User Story:** As a candidate, I want to paste my resume and a job description so that I can see how ready I am for the role before the interview starts.

**Acceptance Criteria:**

1. `POST /api/readiness/analyze` accepts `target_role`, `job_description`, `resume`, optional `company_name`, and `interview_type` (technical / behavioral / mixed).
2. The endpoint returns `readiness_score` (integer 0–100), `summary` (2–3 sentence narrative), `strong_matches`, `partial_matches`, `missing_or_weak` (each a list of `{label, evidence, category}`), `interview_focus_areas` (ordered list), and `prep_brief` (bullet list).
3. The endpoint creates a session record in the `sessions` table with `target_role`, `company_name`, `interview_type`, `readiness_score`, and `summary` populated.
4. Each skill item from the analysis is inserted into the `gaps` table with the correct `category` and `evidence`.
5. When `MOCK_LLM=1` or `GROQ_API_KEY` is absent, the endpoint returns deterministic demo data for the "Backend Engineer Intern" scenario without calling the LLM.
6. `job_description` must be at least 50 characters; `resume` must be at least 50 characters. Shorter inputs return HTTP 422 with a descriptive field error.
7. `job_description` is capped at 8000 characters and `resume` at 6000 characters; inputs exceeding these limits return HTTP 422.
8. The LLM prompt (`prompts/readiness_analysis.md`) instructs the model to return strict JSON matching the response schema; malformed LLM output returns HTTP 500 with `detail: "Analysis failed"`.

### Requirement 1.2 — Gap Map Frontend (Steps 1–3)

**User Story:** As a candidate, I want to see a visual gap map after submitting my resume so that I understand exactly which skills I need to work on.

**Acceptance Criteria:**

1. The `/practice` route renders a 5-step progress indicator (`StepProgress`) showing the current step.
2. Step 1 (`InputPanel`) collects target role, JD text, resume text, optional company name, and interview type. All required fields show inline validation errors before submission.
3. After successful analysis, the app navigates to Step 2 (Gap Map) without a full page reload.
4. Step 2 renders `ReadinessScoreCard` showing the numeric score (0–100) with color coding: 0–40 red, 41–70 amber, 71–100 green.
5. Step 2 renders `SkillGapMap` with three columns (Strong / Partial / Missing), each skill as a color-coded badge. Hovering a badge shows the evidence quote (or "No direct evidence" if null).
6. Step 2 shows the ordered `interview_focus_areas` list below the skill map.
7. Step 3 renders `PrepBriefCard` with the `prep_brief` bullet points and a "Start Interview" CTA button.
8. All three steps are accessible via the `StepProgress` component (clicking a completed step navigates back to it).

### Requirement 1.3 — DB Schema Extensions

**User Story:** As a developer, I need the database schema to store gap analysis results so that the interview loop and report can reference them.

**Acceptance Criteria:**

1. Migration `database/migrations/002_roleready_extensions.sql` adds columns `target_role`, `company_name`, `interview_type`, `readiness_score`, `summary` to the `sessions` table using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
2. The `gaps` table is created with columns: `id`, `session_id` (FK), `label`, `category` (strong/partial/missing), `evidence`, `status` (open/improved/closed), `created_at`.
3. The `reports` table is created with columns: `id`, `session_id` (FK), `summary`, `strengths_json`, `gaps_json`, `scores_json`, `followup_json`, `next_steps_json`, `created_at`.
4. All new tables have appropriate indexes on `session_id`.
5. The migration is idempotent (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) so it can be re-run safely.
6. Existing `sessions` and `turns` data is not affected by the migration.

---

## Workstream 2: Adaptive Interview Loop

### Requirement 2.1 — Gap-Driven Session Creation

**User Story:** As a candidate, I want the interview questions to be generated from my specific gaps so that the mock interview is relevant to the role I'm targeting.

**Acceptance Criteria:**

1. `POST /api/sessions` accepts an optional `readiness_analysis` object containing `session_id`, `strong_matches`, `partial_matches`, `missing_or_weak`, `interview_focus_areas`, `target_role`, and `interview_type`.
2. When `readiness_analysis` is provided, the session manager generates 4–6 interview questions targeting the `missing_or_weak` and `partial_matches` gaps, ordered by `interview_focus_areas` priority.
3. When `readiness_analysis` is absent, the existing behavior (loading `demo_questions.yaml`) is preserved unchanged.
4. The generated questions are stored in the in-process `SessionState` with the gap context attached to each question.
5. The session's `open_gaps` list is initialized from `missing_or_weak` labels.
6. The response includes `intro_message` as before, plus `total_questions` reflecting the generated count.

### Requirement 2.2 — Typed Turn Endpoint

**User Story:** As a candidate, I want to type my answers instead of speaking so that I can practice without a microphone.

**Acceptance Criteria:**

1. `POST /api/sessions/{session_id}/turns` accepts `{user_message: string}` and returns a `TurnResponse`.
2. `TurnResponse` includes: `turn_id`, `classification`, `ai_response`, `detected_strengths` (list), `missing_gap` (nullable string), `follow_up_reason` (nullable string), `guardrail_activated` (boolean), and `updated_session_state`.
3. `updated_session_state` includes: `current_gap_being_tested`, `probe_count`, `open_gaps`, `closed_gaps`, `guardrail_activations`, `session_status`.
4. The endpoint persists both the candidate turn and the agent turn to the `turns` table.
5. The endpoint updates the `gaps` table: when a gap is addressed, its `status` changes from `open` to `improved` or `closed` based on classification quality.
6. When `session_status` is `"ending"` (all questions answered), the response signals the frontend to show the "Finish Interview" button.
7. The endpoint returns HTTP 404 if the session does not exist and HTTP 409 if the session is already ended.

### Requirement 2.3 — Ghostwriting Guardrail

**User Story:** As a product owner, I need the system to refuse to write answers for candidates so that the tool teaches rather than cheats.

**Acceptance Criteria:**

1. The server-side regex check in `sub_agent.py` is extended to cover the patterns: "just tell me what to say", "give me the answer", "what should I say", "write it for me", "tell me the answer", "give me a sample", "give me a template", "can you answer this for me".
2. When a ghostwriting pattern is detected, `guardrail_activated` is `true` in the response and `ai_response` contains a Socratic refusal (not an answer).
3. In `learning` mode, the refusal includes a warm explanation and a Socratic nudge question.
4. In `professional` mode, the refusal is curt with no explanation.
5. The `guardrail_activations` counter in session state increments on each detection.
6. The `GhostwritingGuardrailBadge` component is rendered inline in the transcript when `guardrail_activated` is `true`.

### Requirement 2.4 — Adaptive Follow-Up Logic

**User Story:** As a candidate, I want the AI to probe my specific weak areas so that I get targeted practice on what matters most.

**Acceptance Criteria:**

1. The `turn_classifier` prompt (`prompts/turn_classifier.md`) returns JSON with fields: `kind` (complete/partial/clarify/stall), `gap_addressed` (nullable), `detected_strengths` (list), `follow_up_reason` (nullable string explaining why a follow-up is needed).
2. The `followup_generator` prompt (`prompts/followup_generator.md`) receives the `follow_up_reason` and generates a single focused follow-up question targeting the specific open gap.
3. The sub-agent selects the highest-priority open gap (ordered by `interview_focus_areas`) as the probe target when multiple gaps remain open.
4. Probe count per gap is capped at 3; after 3 probes the gap is marked `closed` regardless of coverage (existing behavior preserved).
5. When all gaps are closed or all questions are answered, `session_status` transitions to `"ending"`.
6. The `LiveGapPanel` component updates in real time after each turn response, showing the current gap, detected strength, and follow-up reason.

### Requirement 2.5 — InterviewRoom UI

**User Story:** As a candidate, I want a clear three-panel interview interface so that I can see my progress, the conversation, and gap tracking simultaneously.

**Acceptance Criteria:**

1. The InterviewRoom renders three panels: left sidebar (session metadata), center (transcript + input), right (LiveGapPanel).
2. The center panel shows a scrollable conversation transcript using `TranscriptBubble` components, with agent bubbles left-aligned and candidate bubbles right-aligned.
3. The center panel has a text input box and "Submit" button as the primary interaction. The mic button is present but labeled as secondary/optional.
4. The left sidebar shows: question number (e.g., "Question 2 of 5"), interview focus area, current gap being tested, probe count (e.g., "1 / 3"), and session status.
5. The right panel (`LiveGapPanel`) shows: detected strength (green chip), missing gap (amber chip), follow-up reason (italic text), and running lists of open and closed gaps.
6. The "Finish Interview" button appears when `session_status` is `"ending"` or after the candidate has answered all questions.
7. The UI is responsive and usable on screens ≥ 1024px wide (three-panel layout) and ≥ 768px wide (stacked layout).

---

## Workstream 3: Feedback Report & Dashboard

### Requirement 3.1 — Report Generation Endpoint

**User Story:** As a candidate, I want a detailed feedback report after my interview so that I know exactly what to improve.

**Acceptance Criteria:**

1. `POST /api/sessions/{session_id}/finish` generates a full report from the session's turns and gap tracker state.
2. The report includes: `summary` (narrative), `strengths` (list with transcript evidence), `gaps` (list with open/improved/closed status), `scores` (5 dimensions: role_alignment, technical_clarity, communication, evidence_strength, followup_recovery, each 0–10), `follow_up_analysis` (list of {question, reason, candidate_response_quality}), `next_practice_plan` (3–5 actionable items).
3. The report is persisted to the `reports` table.
4. The endpoint is idempotent: calling it a second time returns the existing report without regenerating.
5. If the session has zero turns, the endpoint returns HTTP 422 with `detail: "No turns to analyze"`.
6. The session `state` is updated to `ENDED` and `ended_at` is set.
7. When `MOCK_LLM=1`, the endpoint returns deterministic demo report data.

### Requirement 3.2 — Report Retrieval Endpoint

**User Story:** As a candidate, I want to view my report at any time after the interview so that I can revisit my feedback.

**Acceptance Criteria:**

1. `GET /api/sessions/{session_id}/report` returns the stored report if it exists.
2. If no report exists (session not yet finished), the endpoint returns HTTP 404 with `detail: "Report not generated yet"`.
3. The response includes all fields from `FinishSessionResponse` plus `created_at` and session metadata (`target_role`, `started_at`, `ended_at`).
4. `GET /api/sessions` (list) is extended to include `target_role`, `readiness_score`, and `main_gap` (the first open gap label, or null if all closed) in each list item.

### Requirement 3.3 — Report Frontend (Step 5)

**User Story:** As a candidate, I want to see my scores, strengths, gaps, and a practice plan in a clear report page so that I can act on the feedback immediately.

**Acceptance Criteria:**

1. The report page at `/practice/report?session_id=...` renders `ReportSummary`, five `ScoreCard` components, a strengths list, a gaps list, a follow-up analysis section, and `NextPracticePlan`.
2. `ReportSummary` shows: target role, date, duration, readiness score (before interview), and the narrative summary.
3. Each `ScoreCard` shows the dimension name, score (0–10), a color-coded progress bar, and a one-line justification.
4. The follow-up analysis section is titled "Why the AI asked follow-ups" and lists each follow-up question with its reason and the candidate's response quality.
5. `NextPracticePlan` shows 3–5 ordered action items with appropriate icons.
6. The page has a "Start Another Session" CTA that links to `/practice/setup`.
7. The page has a "Back to Dashboard" link.

### Requirement 3.4 — Dashboard Rebrand and Enhancement

**User Story:** As a candidate, I want my dashboard to show RoleReady AI branding and my session history with role and gap information so that I can track my progress over time.

**Acceptance Criteria:**

1. The `Layout` component nav bar is updated to show "RoleReady AI" instead of "Interview Coach".
2. The dashboard at `/dashboard` shows `DashboardStats` at the top when at least one session exists: total sessions, average readiness score, most common gap.
3. Each `SessionCard` on the dashboard shows: `target_role` (or "Generic Interview" if null), date, `readiness_score` (or dash if null), `main_gap` (or dash if null), status badge, and "View Report" link.
4. The "Start Interview" button on the dashboard links to `/practice/setup` (not `/interview/new`).
5. When no sessions exist, the empty state shows RoleReady AI branding and a "Start Your First Practice" CTA linking to `/practice/setup`.
6. Seeded demo data is shown if no real sessions exist and `MOCK_LLM=1` is set: one completed session with the "Backend Engineer Intern" scenario.

### Requirement 3.5 — Eval Golden Cases

**User Story:** As a developer, I want a set of golden interview cases so that I can validate the AI's classification and follow-up behavior against known-good examples.

**Acceptance Criteria:**

1. `evals/golden_interview_cases.yaml` contains at least 8 test cases covering: strong answer (expect `complete`), partial answer (expect `partial` + specific gap), stall (expect `stall`), ghostwriting attempt (expect `refusal`), clarifying question (expect `clarify`), follow-up recovery (candidate improves after probe), guardrail in learning mode, guardrail in professional mode.
2. Each case includes: `id`, `description`, `mode`, `persona_id`, `question`, `gap_hints`, `candidate_transcript`, `expected_classification`, `expected_gap_addressed` (nullable), `expected_guardrail_activated` (boolean).
3. The file uses the demo scenario (Backend Engineer Intern) for all cases.

---

## Cross-Cutting Requirements

### Requirement 4.1 — Mock Mode

**Acceptance Criteria:**

1. Setting `MOCK_LLM=1` in the environment causes all LLM calls to return deterministic fixture responses without calling the Groq API.
2. Mock responses are defined in `backend/llm/mock_responses.py` keyed by prompt name.
3. The full end-to-end flow (analyze → session → turns → finish → report) works with `MOCK_LLM=1` and no `GROQ_API_KEY`.
4. Mock mode is documented in `README.md` and `GETTING_STARTED.md`.

### Requirement 4.2 — Backward Compatibility

**Acceptance Criteria:**

1. The existing `/interview/new` → `/interview/{sessionId}` → `/report/{sessionId}` flow continues to work unchanged.
2. The existing WebSocket endpoint `/ws/interview/{session_id}` continues to work unchanged.
3. The existing `POST /api/sessions` without `readiness_analysis` continues to create a generic session with `demo_questions.yaml`.
4. The existing `GET /api/sessions/{id}/report` endpoint continues to return the old report shape for sessions without a `reports` table entry.
5. DB migration is additive only — no existing columns or tables are dropped or renamed.

### Requirement 4.3 — Responsible AI

**Acceptance Criteria:**

1. The system never generates a complete answer to an interview question on behalf of the candidate, in any mode or persona.
2. The ghostwriting guardrail is enforced server-side and cannot be bypassed by frontend manipulation.
3. The feedback report does not include model answers or "what you should have said" content.
4. The `NextPracticePlan` items are learning resources and practice suggestions, not scripted answers.
5. The system prompt for all LLM calls includes an explicit instruction not to ghostwrite answers.
