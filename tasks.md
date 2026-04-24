# Interview Coach — Implementation tasks

Tasks are grouped by milestone. Each references the user stories it addresses. Tests are sequenced inline (TDD) rather than stacked at the end. Each milestone produces something runnable and demonstrable.

If running this whole spec feels heavy in Kiro, natural seams to split into separate specs are: foundations + research, mock interview core, coding round, progression, practice mode. The ordering below assumes a single comprehensive build.

## Milestone 1: Foundations

- [ ] 1.1 Scaffold monorepo per `steering/structure.md` (`/web`, `/gateway`, `/services`, `/prompts`, `/config`, `/proto`, `/infra`)
- [ ] 1.2 Set up `docker-compose.yml` with Postgres 16 + pgvector, Redis 7, Judge0, and placeholder service containers
- [ ] 1.3 Postgres migrations: `users`, `candidate_topics`, `candidate_attributes`, `interview_sessions`, `turns`, `reports`, `interview_questions`, `coding_attempts` [US 1.1, 3.1, 7.1, 8.1, 9.1, 15.1]
- [ ] 1.4 Postgres migrations for progression event log: `xp_events`, `level_up_events`, `streak_events`, `achievement_earned_events`, `difficulty_change_events`, `scaffolding_refused_events`, plus derived state tables `user_levels`, `streaks`, `user_achievements`, `user_feature_unlocks` [US 10.1, 11.1, 11.2, 12.1, 14.2]
- [ ] 1.5 Postgres migration for `custom_company_profiles` (research-generated brief storage) [US 2.1]
- [ ] 1.6 JWT auth on gateway: `POST /auth/register`, `POST /auth/login`, `POST /auth/verify` [US 1.1]
- [ ] 1.7 Integration tests for auth (happy path, duplicate email, invalid token)
- [ ] 1.8 Resume upload endpoint with PDF/DOCX parsing (pdfplumber + python-docx) and structured extraction via LLM [US 1.1]
- [ ] 1.9 Job description parsing endpoint with structured extraction and gap analysis vs resume [US 1.3]
- [ ] 1.10 Profile CRUD including target role and target company (`GET/PATCH /users/me/profile`) [US 1.1, 1.2, 1.4]
- [ ] 1.11 Candidate model CRUD with confidence + difficulty update logic [US 3.1, 12.1]
- [ ] 1.12 Unit tests for confidence and difficulty update rules
- [ ] 1.13 Author config schemas and initial content in `config/` (personas, companies, modes, formats, achievements, rubrics, practice_drills) [US 4.1, 4.2, 7.6, 11.2, 14.1]
- [ ] 1.14 Persona/company/mode loader service with schema validation at startup [US 4.1, 4.2, 7.5]
- [ ] 1.15 Seed interview question bank with 200+ tagged questions across DSA, behavioral, system design, SQL, with gap hints and company fit tags [US 7.1]
- [ ] 1.16 LeetCode SQLite import script: download Hugging Face dataset on `make setup`, validate row count, build indexes [US 8.1]
- [ ] 1.17 CI pipeline (lint, typecheck, unit tests, Docker build, config schema validation)

## Milestone 2: Research agent and onboarding

- [ ] 2.1 Tavily client wrapper with rate limiting and error handling [US 2.1]
- [ ] 2.2 Author `research_brief` prompt template that summarizes Tavily results into the company profile schema [US 2.1]
- [ ] 2.3 Implement research agent service with concurrent query execution and 30-second budget [US 2.1]
- [ ] 2.4 Implement custom company profile persistence and 30-day staleness check + refresh [US 2.2]
- [ ] 2.5 Build `/onboarding` flow: account → resume → JD paste/upload → role → company (with optional research trigger) → mode preference → diagnostic [US 1.1, 1.2, 1.3, 1.4, 2.1, 3.1]
- [ ] 2.6 Show user the research brief on the pre-session screen so the process is transparent [US 2.1]
- [ ] 2.7 Diagnostic quiz generator producing 5–8 topic-tagged questions weighted by role + JD gaps + company [US 3.1]
- [ ] 2.8 End-to-end test: complete onboarding with a custom company → research brief generated → diagnostic seeded with weighted topics

## Milestone 3: Practice mode and guided learning

- [ ] 3.1 Practice service with single-drill loop (question → answer → 1–2 follow-ups → score) [US 5.1]
- [ ] 3.2 Define `config/practice_drills.yaml` with 10+ drill types (TMAY, why-this-company, conflict, leadership, failure, strengths/weaknesses, single LeetCode, system design warmup, SQL drill) [US 5.1]
- [ ] 3.3 Per-drill scoring breakdown templates that produce structured output specific to drill type [US 5.1]
- [ ] 3.4 Build `/practice` page: drill picker, attempt history per drill with score deltas [US 5.1]
- [ ] 3.5 Wire practice completion to candidate model update + streak increment + half-XP award [US 5.2]
- [ ] 3.6 Author `socratic_step` prompt template with constraints (≤4 sentences, must end in a question) [US 6.1]
- [ ] 3.7 Topic selector for guided learning: lowest confidence not practiced in 24h, tie-break by ascending sample_count [US 6.1]
- [ ] 3.8 Learning engine FastAPI service: `POST /learning/sessions`, `POST /learning/sessions/{id}/turns`, `POST /learning/sessions/{id}/end` [US 6.1]
- [ ] 3.9 Build `/learn/[sessionId]` chat UI with SSE-streamed Socratic responses [US 6.1]
- [ ] 3.10 Wire candidate model update on each learning turn and on session end [US 6.1]
- [ ] 3.11 Tests for topic selector (24h cooldown, tie-breaking, empty-state default)
- [ ] 3.12 End-to-end test: onboard → diagnostic → practice drill → guided learning session → confidence reflected on next session

## Milestone 4: Mock interview — voice and orchestrator

- [ ] 4.1 Deepgram Nova-3 streaming ASR integration with reconnect logic [US 7.1]
- [ ] 4.2 VAD wrapper (silero-vad) with persona-configurable silence threshold (default 1500ms, challenging persona 6000ms allowance) [US 7.1, 7.3]
- [ ] 4.3 ElevenLabs TTS streaming MP3 with mid-stream cancellation for barge-in [US 7.3]
- [ ] 4.4 Speech pipeline service that orchestrates ASR + VAD and emits TurnSignals on the internal event bus [US 7.1, 9.3]
- [ ] 4.5 Filler-word detector via phonetic dictionary on final transcripts [US 9.3]
- [ ] 4.6 librosa + parselmouth prosody analyzer (WPM, pitch range, longest pause) [US 9.3]
- [ ] 4.7 Hume Voice client for confidence + hesitation per turn, with graceful unavailability [US 9.3]
- [ ] 4.8 Redis session state schema + helpers (read/write/flush-to-Postgres) per design §2.3
- [ ] 4.9 Orchestrator state machine (PLANNING, INTRO, RUNNING_QUESTION, INTER_QUESTION, CLOSING) [US 7.1]
- [ ] 4.10 Sub-agent spawn/lifecycle with focused context assembly per question [US 7.4]
- [ ] 4.11 Sub-agent summary protocol (signals observed, gaps unresolved, suggested next probe) returned to orchestrator [US 7.4]
- [ ] 4.12 Thread tracker (`resolve_thread`, `mark_gap_raised`, `increment_probe_count`, `get_open_threads`, `record_first_probe_close`) [US 7.1, 12.1]
- [ ] 4.13 Author `classify_turn` prompt template returning structured JSON [US 7.1]
- [ ] 4.14 Eval set of 50 turn transcripts with human-labeled classifications; require ≥85% agreement before shipping [US 7.1]
- [ ] 4.15 Author `generate_probe` prompt with question, gap hints, transcript context, persona fragment, topic difficulty [US 7.1, 4.2, 12.1]
- [ ] 4.16 Author `safe_clarification` prompt with explicit no-leak instruction [US 7.1]
- [ ] 4.17 Turn handler dispatching on classifier output (complete / partial / clarify / stall) [US 7.1]
- [ ] 4.18 Implement 90s check-in timer for prolonged user silence [US 7.3]
- [ ] 4.19 Implement barge-in: client cancels TTS playback on user-speech VAD event within 200ms [US 7.3]
- [ ] 4.20 Question selection respecting per-topic difficulty ±1, JD gaps, company profile weights [US 7.1, 12.1]
- [ ] 4.21 Persona fragment + mode constraints injected into all sub-agent prompts [US 4.1, 4.2, 7.5]
- [ ] 4.22 Build `/interview/[sessionId]` page: mic controls, live transcript, AI speech indicator, end-session button [US 7.1]
- [ ] 4.23 Graceful degradation to text-input mode if ASR connection fails [NFR]
- [ ] 4.24 End-to-end test: start interview → partial answer triggers probe → complete answer advances → session ends cleanly with sub-agent summaries persisted

## Milestone 5: Streaming pre-decision

- [ ] 5.1 Author `streaming_predecide` prompt template that takes partial transcript and ranks candidate next utterances [US 7.2]
- [ ] 5.2 Implement partial-transcript chunker emitting every 2–3s during active speech [US 7.2]
- [ ] 5.3 TTS pre-fetch service: pre-synthesize the top-ranked candidate utterance to local buffer [US 7.2]
- [ ] 5.4 Discard logic: if user resumes speaking, drop pre-decided utterance and re-run analysis [US 7.2]
- [ ] 5.5 Latency benchmark harness: end-of-turn → first audio byte; tune until <600ms p95 for the selection step [US 7.2, NFR]
- [ ] 5.6 Overall turn latency benchmark: <3s p95 user-stops → AI-begins-speaking [NFR]

## Milestone 6: Live coding round

- [ ] 6.1 LeetCode SQLite query layer: filter by company, difficulty, topic, exclude questions seen in last 30 days [US 8.1]
- [ ] 6.2 Coding service `POST /code/run` bridging to local Judge0 [US 8.1]
- [ ] 6.3 Coding service `GET /code/questions` with eligibility filters [US 8.1]
- [ ] 6.4 Coding service `POST /code/submit` triggering coding sub-agent with editorial in context [US 8.1]
- [ ] 6.5 Build `/code/[sessionId]` page with CodeMirror 6 (syntax highlighting on; autocomplete and linting explicitly off) [US 8.1]
- [ ] 6.6 Wire CodeMirror editor to `/code/run` with stdin/stdout/stderr/test-case display [US 8.1]
- [ ] 6.7 Coding sub-agent context assembly (problem, editorial reference, candidate code, prior turns) [US 8.1]
- [ ] 6.8 Coding follow-up prompts: complexity analysis, alternative approaches, edge cases, scalability [US 8.1]
- [ ] 6.9 Helpfulness levels (silent, hints, guided, full-walkthrough) wired to behavior, with Professional mode locking to silent [US 8.2]
- [ ] 6.10 Verify editorial solution is never rendered to user during or after session (regression test) [US 8.1]
- [ ] 6.11 Latency benchmark: Run-button click → result rendered <4s p95 [NFR]
- [ ] 6.12 End-to-end test: enter coding section → editor loads → user runs code → submits → coding sub-agent asks complexity follow-ups

## Milestone 7: Scaffolding enforcement

- [ ] 7.1 Author `scaffold_refusal.md` prompt fragment with positive and negative refusal examples [US 14.1]
- [ ] 7.2 Inject the scaffolding fragment into every sub-agent's context at spawn [US 14.1]
- [ ] 7.3 Implement scaffolding classifier middleware (regex patterns for obvious cases, short LLM check on ambiguous cases) [US 14.1]
- [ ] 7.4 Force triggered turns through dedicated `scaffold_refusal` template; mode-aware tone (warm in Learning, curt in Professional) [US 14.1]
- [ ] 7.5 Log every refusal as `scaffolding.refused` event [US 14.1]
- [ ] 7.6 Build regression eval set in `services/orchestrator/eval/scaffolding_cases.yaml` with 25+ ghostwriting attempts [US 14.2]
- [ ] 7.7 CI gate: deploy blocked if refusal rate <95% on the eval set [US 14.2]

## Milestone 8: Feedback and reports

- [ ] 8.1 Define feedback report JSON schema (8-metric radar, per-question rubric, delivery metrics, XP breakdown, 1-week prep plan) [US 9.1, 9.2, 10.2]
- [ ] 8.2 Define `config/rubrics.yaml` with explicit signals per metric (confidence, clarity, STAR adherence, technical depth, code quality, recovery, professionalism, presence) [US 9.1]
- [ ] 8.3 Author `generate_feedback` prompt drawing from transcript, prosody, Hume signals, rubrics, company profile emphases [US 9.1, 9.3]
- [ ] 8.4 Implement feedback orchestration (aggregate signals → LLM → JSON → persist) [US 9.1]
- [ ] 8.5 Voice summary synthesizer (60–90s narration of strengths + improvement + next action via ElevenLabs) [US 9.1]
- [ ] 8.6 TLDR generator from the same content (3–5 sentences) [US 9.1]
- [ ] 8.7 1-week prep plan generator with day-by-day actions tied to weak topics [US 9.2]
- [ ] 8.8 Build `/report/[sessionId]` page: voice player at top, TLDR, expandable full breakdown with radar chart [US 9.1]
- [ ] 8.9 Recharts radar chart component for the 8 metrics [US 9.1]
- [ ] 8.10 Mark Hume-derived metrics as unavailable in UI when Hume is down [US 9.3]
- [ ] 8.11 Surface disagreement when Hume and prosody diverge (don't blend) [US 9.3]
- [ ] 8.12 One-click transitions from report to: practice drill, guided learning topic, next interview [US 9.2]
- [ ] 8.13 Retry feedback generation once on failure; surface error without losing transcript [US 9.1]

## Milestone 9: Progression engine

- [ ] 9.1 XP calculator: `base × quality × difficulty + streak_bonus` with mode-specific bases (100/50/25 for interview/learning/practice) [US 10.1]
- [ ] 9.2 Level threshold function `100 × level^1.5` and cumulative-XP → level resolver [US 10.1]
- [ ] 9.3 `session.completed` event handler: write xp_event, check threshold, write level_up_event if crossed [US 10.1]
- [ ] 9.4 `user_feature_unlocks` population on level-up per the level map [US 10.1]
- [ ] 9.5 Feature gate middleware blocking UI entry points for locked features [US 10.1]
- [ ] 9.6 Wire XP breakdown into report payload and celebration modal [US 10.1, 10.2]
- [ ] 9.7 Streak service with timezone-aware day boundary, increment/reset, weekly streak-freeze [US 11.1]
- [ ] 9.8 Anti-guilt copy audit across all streak-related UI [US 11.1]
- [ ] 9.9 Achievement rule evaluator (small DSL) reading `config/achievements.yaml` with 20+ initial achievements [US 11.2]
- [ ] 9.10 Achievement evaluation integrated into session.completed pipeline [US 11.2]
- [ ] 9.11 Build `/achievements` page (earned + locked with criteria visible) [US 11.2]
- [ ] 9.12 Difficulty Manager: per-topic delta from thread resolution patterns, bounded ±1 [US 12.1]
- [ ] 9.13 Difficulty deltas integrated post-XP into session.completed pipeline [US 12.1]
- [ ] 9.14 Probe prompt scales aggressiveness with topic difficulty [US 12.1]
- [ ] 9.15 Tests: XP calculator boundary cases, level thresholds, streak day boundaries, difficulty bounds, achievement DSL evaluation
- [ ] 9.16 Tests verifying client cannot mutate progression state (security test)

## Milestone 10: Dashboard and history

- [ ] 10.1 `GET /users/me/sessions` with pagination and filters [US 15.1]
- [ ] 10.2 `GET /users/me/trends` returning per-topic confidence timeseries and delivery trend indicators [US 15.1]
- [ ] 10.3 `GET /users/me/progression` (current level, XP-to-next, streak, recent unlocks) [US 15.1]
- [ ] 10.4 Build `/dashboard`: level + XP bar, streak, 5 recent sessions, per-topic confidence sparklines, trend indicators, recent unlocks [US 15.1]
- [ ] 10.5 Build `/profile` (earned achievements) [US 11.2]
- [ ] 10.6 Build `/settings` with audio retention toggle, notification preferences, target role/company change with re-diagnostic prompt [US 1.2, 1.4, 11.1, NFR data retention]

## Milestone 11: Challenge modes

- [ ] 11.1 Full-loop session orchestration: 3-round sequence with shared session_group_id, configurable break [US 13.1]
- [ ] 11.2 Pause-and-resume for full-loop within 24h [US 13.1]
- [ ] 11.3 Cross-round feedback prompt surfacing fatigue and consistency drift across rounds [US 13.1]
- [ ] 11.4 Build full-loop UI: round indicator, break screen, cross-round progress [US 13.1]
- [ ] 11.5 Stress mode: challenging persona + per-question time cap + scheduled mid-answer interruption (once per question) + weakest-topic prioritization [US 13.2]
- [ ] 11.6 Apply 1.5× XP multiplier for stress mode sessions [US 13.2]
- [ ] 11.7 End-to-end tests: level-12 user runs full loop; level-15 user runs stress mode

## Milestone 12: Polish, security, and launch prep

- [ ] 12.1 Server-side enforcement audit: XP, level, streak, achievement, and difficulty cannot be set from client [NFR progression integrity]
- [ ] 12.2 Event-sourcing audit: all progression mutations write immutable events; build replay tool [NFR event log]
- [ ] 12.3 Encrypt audio and transcript storage at rest (S3 SSE-KMS, Postgres column encryption for transcripts) [NFR security]
- [ ] 12.4 Verify TLS 1.2+ on all external endpoints [NFR security]
- [ ] 12.5 Cost instrumentation: per-session LLM + ASR + TTS + emotion + research cost; alert if average exceeds $0.60 [NFR cost]
- [ ] 12.6 Load-test audio interview path at 50 concurrent sessions; fix hot spots
- [ ] 12.7 Empty-state and error-state UX pass across all pages
- [ ] 12.8 Privacy policy and terms of service
- [ ] 12.9 Analytics instrumentation (PostHog or Mixpanel): signup, diagnostic, first practice, first learning, first interview, first level-up, first achievement, first full-loop, 7-day return, 30-day return
- [ ] 12.10 Beta recruitment: 25–40 students and early-career engineers for 3-week closed beta
- [ ] 12.11 Triage beta feedback; file follow-on specs for video/attention tracking and any major Phase-3 gaps the beta exposes
