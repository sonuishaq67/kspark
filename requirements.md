# Interview Coach — Requirements

## Overview

A voice-driven AI interview preparation platform that puts candidates through realistic, multi-agent mock interviews — including live coding — and scores them across eight performance dimensions. The platform also supports targeted single-question practice drills and a separate conversational guided-learning mode for skill building. A game-style progression layer (XP, levels, streaks, achievements, adaptive difficulty) ties multi-session usage together so improvement compounds.

The product distinguishes itself through five bets, each of which is testable in this spec:
1. A stateful orchestrator with per-question sub-agents that listens and probes (rather than scripting through a list).
2. A scaffolding principle: the agent refuses ghostwriting and offers Socratic hints instead.
3. Earned progression keyed off a per-user candidate model, not session count.
4. Personas, company profiles, scoring rubrics, and achievement criteria all live in editable YAML so non-engineers can tune the product.
5. Local-first execution where it matters (Judge0 sandbox, SQLite question bank, Redis cache).

Video capture and attention tracking are deferred to a follow-up spec. Mobile apps, multilingual support, and real-time copilot use during actual interviews are explicitly out of scope.

---

## 0. Hackathon scope (overrides §1–§16 for the demo cut)

The hackathon submission proves Bet 1 only. While §0 is in force, the acceptance criteria of the listed user stories below are reduced to the subset stated here, and all other user stories are deferred. After submission, §0 is removed and §1–§16 take over again. See `tasks.md` Milestone 0 and `design.md` ADR-016.

### User story 0.1 (in scope, reduced from §7.1, §7.4)
As a candidate, I want to run a voice interview where the AI probes my gaps instead of advancing.

**Acceptance criteria (demo cut):**
- WHEN I start the demo session THE SYSTEM SHALL load three hand-authored questions with pre-authored gap hints
- WHEN I give an answer that omits a gap covered in the hints THE SYSTEM SHALL classify the turn as `partial` and ask a probe targeting that specific gap
- WHEN I give an answer covering all gap hints THE SYSTEM SHALL classify the turn as `complete`, acknowledge briefly, and advance to the next question
- THE SYSTEM SHALL maintain a thread tracker preventing re-asking a closed gap within the same session
- Streaming pre-decision (§7.2) is **deferred**; end-of-turn → AI-begins is allowed up to 5 seconds at p95 for the demo cut

### User story 0.2 (in scope, reduced from §14.1)
As a candidate, I want the agent to refuse to ghostwrite, so that it acts as a sparring partner.

**Acceptance criteria (demo cut):**
- WHEN I say "just tell me what to say" or any of the four hand-authored ghostwriting probes THE SYSTEM SHALL refuse and offer a Socratic hint
- THE refusal SHALL come from the prompt fragment in `prompts/p2_scaffold_refusal.md` injected into the sub-agent context
- THE middleware classifier and CI ≥95% refusal-rate gate (§14.2) are **deferred**; the demo passes on a manual run of 5 ghostwriting prompts

### User story 0.3 (in scope, reduced from §9.1)
As a candidate, I want a short feedback summary that proves the orchestrator was listening.

**Acceptance criteria (demo cut):**
- WHEN I end the session THE SYSTEM SHALL generate a 3–5 sentence TLDR within 15 seconds
- THE TLDR SHALL explicitly reference at least one gap that was probed during the session
- The voice summary, radar chart, per-question rubric, delivery analytics, XP breakdown, and 1-week plan in §9.1 are **deferred**

### Deferred to post-submission

The following user stories are **out of scope for the demo cut** and resume after submission per the existing §1–§16: 1.1–1.4, 2.1–2.2, 3.1, 4.1–4.2, 5.1–5.2, 6.1, 7.2, 7.3, 7.5, 7.6, 8.1–8.2, 9.2, 9.3, 10.1–10.2, 11.1–11.2, 12.1, 13.1–13.2, 14.2, 15.1.

The following NFRs are **relaxed for the demo cut**: turn latency (3s → 5s p95), cost ceiling (no enforcement), event-log completeness (no progression events emitted), encryption at rest (Postgres default), scaffolding refusal CI gate (manual instead). All NFRs resume after submission.

---

## 1. Onboarding and targeting

### User story 1.1
As a new user, I want to create an account and upload my resume, so that the system can personalize my preparation.

**Acceptance criteria:**
- WHEN a new user submits a valid email and password THE SYSTEM SHALL create an account and send a verification email within 60 seconds
- WHEN a user uploads a PDF or DOCX resume up to 5 MB THE SYSTEM SHALL extract structured data (skills, experience, education, projects) and populate an editable candidate profile
- IF the uploaded file exceeds 5 MB or is an unsupported format THE SYSTEM SHALL reject it with a clear error message

### User story 1.2
As a user, I want to specify my target role, so that learning and interview content is tuned to what I'll be tested on.

**Acceptance criteria:**
- WHEN a user reaches role selection THE SYSTEM SHALL offer at minimum: Backend SWE, Frontend SWE, Full-stack SWE, Mobile SWE, ML Engineer, Data Engineer, Data Scientist, DevOps/SRE
- WHEN a user changes their role from settings THE SYSTEM SHALL prompt them to re-run the diagnostic on the new role's key topics

### User story 1.3
As a user, I want to paste or upload a target job description, so that the system can tailor questions and scoring rubrics to that specific role.

**Acceptance criteria:**
- WHEN a user pastes or uploads a job description THE SYSTEM SHALL extract structured data (responsibilities, required skills, nice-to-haves, seniority signals)
- WHEN a job description is parsed THE SYSTEM SHALL compute a gap analysis between the JD's requirements and the user's resume, surfacing the top three gaps as suggested practice focus areas
- WHEN no JD is provided THE SYSTEM SHALL fall back to a role-tuned generic profile

### User story 1.4
As a user, I want to select a target company (or accept a generic profile), so the interviewer style and question mix match what I'm preparing for.

**Acceptance criteria:**
- WHEN a user reaches company selection THE SYSTEM SHALL display available company profiles including at minimum: Amazon, Google, Meta, Microsoft, generic FAANG, generic startup, Indian IT majors
- WHEN a user types a company name not in the static catalog THE SYSTEM SHALL trigger the background research agent (see §2) to generate a custom company profile
- A user SHALL be able to change target company from settings, taking effect for the next session started

---

## 2. Background research agent

### User story 2.1
As a user, I want the system to research my target company and role while I finish setup, so that the interviewer arrives well-briefed.

**Acceptance criteria:**
- WHEN a user begins the setup form THE SYSTEM SHALL kick off a background research job using Tavily that gathers: company-specific interview patterns, expected technical stack, common behavioral themes, role-specific expectations, and recent (last 12 months) signal from forums and engineering blogs
- THE SYSTEM SHALL complete the research job within a 30-second budget and surface the brief to the orchestrator before the user clicks Start
- WHEN research completes THE SYSTEM SHALL persist the brief as a `custom-{company}-{timestamp}` profile so it can be reused for future sessions
- IF research fails or exceeds the budget THE SYSTEM SHALL fall back to the static company profile (if available) or a generic role-tuned profile, surfacing a non-blocking notice to the user
- THE SYSTEM SHALL show the user a summary of the research brief on the pre-session screen ("here's what I found out about your interview") to keep the process transparent — no black box

### User story 2.2
As a user, I want stale research to refresh automatically, so the brief reflects recent reality.

**Acceptance criteria:**
- WHEN a custom research profile is older than 30 days and reused THE SYSTEM SHALL re-run the research in the background and merge new findings before session start

---

## 3. Candidate model and diagnostic

### User story 3.1
As a user, I want the system to assess my knowledge baseline, so learning sessions and interviews are calibrated from the start.

**Acceptance criteria:**
- WHEN a user finishes onboarding THE SYSTEM SHALL present a diagnostic covering 5–8 topics inferred from the role, JD gaps, and company profile
- WHEN the user submits diagnostic responses THE SYSTEM SHALL initialize a candidate knowledge model with confidence (0.0–1.0) and starting difficulty (1–5) per topic
- WHEN the user skips the diagnostic THE SYSTEM SHALL initialize a default model from resume inference with low-certainty flags
- WHILE any session is active THE SYSTEM SHALL update the candidate model based on observed performance within 5 seconds of turn completion

---

## 4. Modes and personas

### User story 4.1
As a user, I want to choose between Learning mode (patient, helpful) and Professional mode (strict, formal), so I can target either skill-building or readiness calibration.

**Acceptance criteria:**
- THE SYSTEM SHALL offer two modes selectable at session start: Learning and Professional
- WHEN Learning mode is active THE SYSTEM SHALL allow the agent to: explain what a strong answer would have included after the candidate's attempt, offer non-leading hints when stuck for 30+ seconds, use encouraging acknowledgments, and surface scoring as guidance rather than judgment
- WHEN Professional mode is active THE SYSTEM SHALL forbid: hints, encouragements, post-attempt explanations of strong-answer structure during the session (these still appear in the post-session report), and any hand-holding language
- BOTH modes SHALL respect the scaffolding principle (§14) — the difference is whether refusals are explained or silent

### User story 4.2
As a user, I want to choose interviewer persona within a mode, so I can practice with different interviewer styles.

**Acceptance criteria:**
- THE SYSTEM SHALL offer at least three personas: friendly (supportive, encouraging), neutral (professional, matter-of-fact), challenging (pushback-heavy, frequent follow-ups)
- Persona configurations SHALL modulate: tone of acknowledgments, frequency of pushback ("are you sure about that?"), depth of follow-up probing, transition pacing
- IN Learning mode THE SYSTEM SHALL default to friendly and allow neutral; challenging is unavailable in Learning mode
- IN Professional mode THE SYSTEM SHALL default to neutral and allow challenging once the user reaches level 9

---

## 5. Practice mode

### User story 5.1
As a user, I want to drill specific question types in short, repeatable sessions, so I can build daily habit and target known weaknesses.

**Acceptance criteria:**
- THE SYSTEM SHALL offer a Practice mode distinct from full mock interviews, with at least these drill types: Tell-me-about-yourself, Why this company / role, Tell-me-about-a-challenge, Conflict, Leadership example, Failure / lessons learned, Strengths and weaknesses, Single LeetCode question, System design warmup (10–15 min), Single SQL problem
- WHEN a user selects a drill THE SYSTEM SHALL ask the question, listen to the full answer, ask one or two focused follow-ups, then immediately produce a structured score breakdown specific to that drill type
- IN Learning mode THE SYSTEM SHALL also explain what a strong answer would have included after the user's attempt
- A user SHALL be able to re-attempt the same drill immediately and see attempt history with score deltas

### User story 5.2
As a user, I want my practice attempts to count toward progression, so daily drills feel meaningful.

**Acceptance criteria:**
- WHEN a practice drill completes (5+ turns) THE SYSTEM SHALL award XP at half the rate of full interview sessions, count it for streak purposes, and update the candidate model on the relevant topic

---

## 6. Guided learning mode

### User story 6.1
As a user, I want a conversational tutor that nudges me toward weak areas, so I can close concept gaps before interviewing.

**Acceptance criteria:**
- WHEN a user starts guided learning THE SYSTEM SHALL select the topic with the lowest confidence not practiced in the last 24 hours
- WHEN the tutor introduces a concept THE SYSTEM SHALL use Socratic prompting (probing questions, no lecture blocks longer than 4 sentences before re-engagement)
- WHEN a user demonstrates correct understanding THE SYSTEM SHALL raise confidence and advance to a related concept
- WHEN a user struggles (wrong answer, "I don't know," or stalled 30+ seconds) THE SYSTEM SHALL offer a worked example or break the concept into sub-steps, and SHALL NOT advance the topic
- WHEN a learning session ends THE SYSTEM SHALL persist the updated model and suggest the next topic for follow-up
- IF the LLM reasoning layer is unavailable THE SYSTEM SHALL inform the user and offer to resume later rather than degrade silently

---

## 7. Mock interview — voice and orchestration

### User story 7.1
As a user, I want to practice voice-driven mock interviews with an AI that actually listens, so practice feels realistic and exposes real weaknesses.

**Acceptance criteria:**
- WHEN a user starts a mock interview THE SYSTEM SHALL load the appropriate format config (recruiter screen, hiring manager round, technical screen, full custom, etc.) and assemble a question plan weighted by candidate model, role, JD gap analysis, and company profile
- WHEN the user speaks THE SYSTEM SHALL transcribe audio in real time via streaming ASR, rendering a visible transcript with under 1 second rolling delay
- WHILE the user is speaking THE SYSTEM SHALL run streaming pre-decision (§7.2) so the next utterance is ready when the user stops
- WHEN silence is detected for 1.5–6 seconds (configurable per persona) THE SYSTEM SHALL classify the just-completed turn as one of: complete-answer, partial-answer, clarifying-question, stall
- IF the turn is classified as partial-answer THE SYSTEM SHALL generate a probe targeting the specific gap rather than moving on
- IF the turn is classified as complete-answer THE SYSTEM SHALL mark the thread closed, acknowledge briefly, and advance
- IF the turn is classified as clarifying-question THE SYSTEM SHALL answer without revealing the solution and return control to the user
- IF the turn is classified as stall THE SYSTEM SHALL wait at least 10 seconds (challenging persona: 6 seconds) before prompting again
- WHILE the session is active THE SYSTEM SHALL maintain a thread tracker preventing re-asking resolved questions and forgetting unresolved ones
- WHEN the user generates filler words or rambles THE SYSTEM SHALL record signals for the post-session report but SHALL NOT interrupt
- WHEN the user explicitly asks for a model answer ("just tell me what to say") THE SYSTEM SHALL refuse per the scaffolding principle (§14)
- WHEN all planned questions are closed or the user ends the session THE SYSTEM SHALL terminate and trigger feedback generation within 30 seconds

### User story 7.2
As a user, I want the interviewer to respond instantly when I stop talking, so the interaction feels natural rather than scripted.

**Acceptance criteria:**
- WHILE the user is speaking THE SYSTEM SHALL run a lightweight reasoning call against the partial transcript every 2–3 seconds, ranking possible follow-ups and pre-fetching the top candidate's TTS payload
- WHEN end-of-turn is detected THE SYSTEM SHALL select the top-ranked follow-up and begin playback within 600 ms p95 (separate from the overall 3-second turn-latency budget that includes synthesis time)
- IF the user resumes speaking before end-of-turn confirmation THE SYSTEM SHALL discard the pre-decided utterance and re-run the analysis

### User story 7.3
As a user, I want the AI to respect natural conversational pauses, so I'm not interrupted mid-thought.

**Acceptance criteria:**
- WHILE the user is speaking (VAD active) THE SYSTEM SHALL NOT emit any TTS audio
- WHEN the user barges in during the AI's turn THE SYSTEM SHALL cut TTS within 200 ms and begin transcribing the user
- WHEN the system has been silent for 90+ seconds without user speech THE SYSTEM SHALL offer a gentle check-in
- THE SYSTEM SHALL allow at minimum a 6-second silent pause for thinking without prompting, configurable per persona

### User story 7.4
As a user, I want each question to feel sharply contextual, so follow-ups don't feel canned.

**Acceptance criteria:**
- THE ORCHESTRATOR SHALL spawn a fresh sub-agent per question with focused context: question text, gap hints, candidate's intro summary, persona fragment, mode constraints
- AFTER each question's exchange the SUB-AGENT SHALL summarize findings (signals observed, gaps still open, confidence in completeness) back to the orchestrator
- The ORCHESTRATOR SHALL use sub-agent summaries to update thread tracker and decide the next question or transition

### User story 7.5
As a user, I want the interviewer's style to match the company I'm targeting, so practice is representative.

**Acceptance criteria:**
- WHEN an interview starts with a company profile (static or research-generated) THE SYSTEM SHALL apply the persona configuration, topic weights, and rubric emphases for that profile
- WHILE an interview is in progress THE SYSTEM SHALL NOT break persona mid-session even if the user attempts to redirect

### User story 7.6
As a user, I want to choose from pre-built interview formats or build my own, so I'm not locked into one structure.

**Acceptance criteria:**
- THE SYSTEM SHALL ship with at minimum these pre-built formats: recruiter screen (30 min), hiring manager round (45–60 min), technical screen (60 min), Meta PE-style loop (45 min), data engineer screen (60 min), ML engineer loop (60 min)
- THE SYSTEM SHALL provide a custom format builder where users define total duration, sections (intro, behavioral, technical concepts, coding, closing), per-section durations, topic focus, and difficulty
- Pre-built formats SHALL be saved configurations of the same schema; a user SHALL be able to fork any pre-built format and customize it

---

## 8. Live coding round

### User story 8.1
As a user, I want to do a live coding round inside the interview, so the practice covers what real technical interviews actually test.

**Acceptance criteria:**
- WHEN the orchestrator transitions to a coding section THE SYSTEM SHALL select a question from the LeetCode SQLite bank filtered by target company tags, configured difficulty, and role-relevant topic tags
- THE SYSTEM SHALL avoid repeating any LeetCode question shown to the user in the past 30 days
- THE CODING UI SHALL provide CodeMirror 6 with syntax highlighting for Python, JavaScript, Java, C++, and SQL, line numbers, and bracket matching, but SHALL NOT provide autocomplete, linting, or AI suggestions
- WHEN the user clicks Run THE SYSTEM SHALL submit code, language, and stdin to the local Judge0 instance and return stdout, stderr, and pass/fail per test case within 4 seconds at p95
- WHEN the user submits or the coding timer expires THE SYSTEM SHALL trigger the coding sub-agent to ask follow-ups: time complexity, space complexity, alternative approaches, edge cases, scalability
- WHEN feedback is generated THE SYSTEM SHALL evaluate the user's solution against the editorial reference loaded from the question bank, but SHALL NEVER reveal the editorial solution to the user during or after the session

### User story 8.2
As a user, I want the coding round helpfulness level to match my mode and preference.

**Acceptance criteria:**
- THE SYSTEM SHALL offer a helpfulness setting per coding round: silent, hints, guided, full-walkthrough
- IN Professional mode the helpfulness setting SHALL be locked at silent
- THE hints level SHALL provide a single non-leading nudge after 5 minutes of no progress (e.g., "What data structure might let you look up by key in O(1)?")
- THE guided level SHALL provide structured questioning to help the user converge (e.g., "Walk me through what happens when the input is empty")
- THE full-walkthrough level SHALL be available only in Learning mode and SHALL still respect scaffolding (no model-code dictation; only Socratic guidance)

---

## 9. Post-session feedback

### User story 9.1
As a user, I want comprehensive feedback after every session in three layers, so I can choose how deep to go.

**Acceptance criteria:**
- WHEN a session ends THE SYSTEM SHALL generate a feedback report within 30 seconds with three layers:
  - **Voice summary (60–90 seconds)** — synthesized audio walking the user through their top strengths, top improvement, and one specific next action
  - **TLDR (3–5 sentences)** — a written summary identical in substance to the voice summary
  - **Full breakdown** — radar chart of all eight metrics, per-question analysis, delivery analytics, XP breakdown, and a 1-week prep plan
- THE eight metrics SHALL be: confidence, clarity, STAR adherence, technical depth, code quality, recovery under pressure, professionalism, presence and engagement
- Each metric's score SHALL be computable from observable signals defined in `config/rubrics.yaml`; the rubric file SHALL be the single source of truth for what each score means

### User story 9.2
As a user, I want to know exactly what to do next after a session, so feedback turns into action.

**Acceptance criteria:**
- THE full breakdown SHALL include a 1-week prep plan with day-by-day actions tied to specific weak topics observed in the session
- THE report SHALL offer a one-click transition to: practice mode on a recommended drill, guided learning on the recommended topic, or another mock interview at the next-up difficulty

### User story 9.3
As a user, I want my confidence and hesitation signals captured accurately, so the report reflects how I actually came across.

**Acceptance criteria:**
- THE SYSTEM SHALL stream final-turn audio chunks to Hume Voice for confidence and hesitation scoring
- THE SYSTEM SHALL run librosa/parselmouth in parallel for objective metrics: words per minute, pitch range, longest pause, filler-word rate
- WHERE the two signals disagree (Hume says low confidence, prosody says steady pace) THE SYSTEM SHALL surface both in the report rather than synthesizing them into a single number
- IF Hume is unavailable THE SYSTEM SHALL omit the emotion-specific metrics rather than fabricate them, marking them as unavailable

---

## 10. XP, levels, and feature unlocks

### User story 10.1
As a user, I want XP and levels based on demonstrated performance, so progression feels meaningful rather than cosmetic.

**Acceptance criteria:**
- WHEN any session completes THE SYSTEM SHALL award XP as: `base × quality × difficulty + streak_bonus`
  - base: 100 for full interview, 50 for guided learning, 25 for practice drill
  - quality: 0.5 if content score < 40, 1.0 if 40–70, 1.5 if > 70
  - difficulty: 0.8 + (avg_session_difficulty × 0.1)
  - streak_bonus: min(current_streak × 5, 100)
- WHEN cumulative XP crosses `100 × level^1.5` THE SYSTEM SHALL level up the user
- WHEN a level-up unlocks a feature THE SYSTEM SHALL surface that unlock in the post-session celebration moment (never mid-session)

**Indicative level map (tuneable in `config/modes/`):**
- Level 1: Practice mode + guided learning
- Level 3: Mock interview unlocked (Learning mode, friendly persona, single section)
- Level 5: Full mock interview (multi-section), neutral persona unlocked
- Level 7: Professional mode unlocked
- Level 9: Challenging persona unlocked
- Level 10: Company-specific profiles (beyond generic) unlocked
- Level 12: Full-loop simulation unlocked
- Level 15: Stress mode unlocked

### User story 10.2
As a user, I want to understand why I got the XP I got, so the system feels transparent.

**Acceptance criteria:**
- WHEN XP is awarded THE SYSTEM SHALL show a breakdown (base, quality, difficulty, streak) in the post-session report

---

## 11. Streaks and achievements

### User story 11.1
As a user, I want streaks to encourage consistent practice without becoming a source of anxiety.

**Acceptance criteria:**
- WHEN a user completes at least one session (any kind, 5+ turns) in a calendar day in their local timezone THE SYSTEM SHALL increment streak
- IF a user misses a day THE SYSTEM SHALL offer one free streak freeze per week
- THE SYSTEM SHALL NOT use guilt-driven copy
- THE SYSTEM SHALL send at most one reminder per day, and only if the user has explicitly enabled it

### User story 11.2
As a user, I want to earn badges for meaningful milestones, so progression has texture beyond levels.

**Acceptance criteria:**
- THE SYSTEM SHALL define at minimum 20 achievements across categories: consistency, mastery, variety, breakthrough, grit
- Achievements SHALL be tied to demonstrated skill, not time spent
- WHEN an achievement criterion is met THE SYSTEM SHALL grant the badge and surface a notification at session end
- A user SHALL be able to view earned and locked achievements with criteria visible

---

## 12. Adaptive difficulty

### User story 12.1
As a user, I want the interviewer to get harder as I improve on a topic, so practice remains challenging.

**Acceptance criteria:**
- THE SYSTEM SHALL maintain difficulty (1–5) per user per topic in the candidate model
- WHEN a user closes a thread on the first probe at current difficulty THE SYSTEM SHALL increment difficulty (max 5) after the session
- WHEN a user requires 3+ probes or fails to close THE SYSTEM SHALL decrement difficulty (min 1) after the session
- Question selection SHALL prefer questions at user's current difficulty ±1 per topic
- Probe aggressiveness SHALL scale with topic difficulty
- THE SYSTEM SHALL never change difficulty by more than ±1 per session per topic

---

## 13. Challenge modes

### User story 13.1
As a user, I want to practice full-loop simulations once I've leveled up, so I can stress-test stamina across an interview day.

**Acceptance criteria:**
- WHEN a user reaches level 12 THE SYSTEM SHALL unlock full-loop mode: 3 back-to-back rounds (behavioral, technical with coding, system design) with a configurable break
- THE SYSTEM SHALL persist state across rounds, support pause-and-resume within 24 hours
- THE final report SHALL include cross-round signals (fatigue, consistency drift)

### User story 13.2
As a user, I want stress-mode practice for tough interviews.

**Acceptance criteria:**
- WHEN a user reaches level 15 THE SYSTEM SHALL unlock stress mode: challenging persona, time caps per question, scheduled mid-answer interruption (once per question), weakest-topic prioritization
- Stress mode sessions SHALL award 1.5× XP

---

## 14. Scaffolding principle (cross-cutting)

This section applies to every mode (Learning, Professional, Practice, Guided Learning, all coding helpfulness levels).

### User story 14.1
As a user, I want the agent to refuse to give me model answers, so I learn by doing rather than copying.

**Acceptance criteria:**
- WHEN a user requests a model answer ("just tell me what to say," "give me the answer," "what should I say here") THE SYSTEM SHALL refuse and offer a Socratic hint instead
- THE refusal SHALL be implemented as a dedicated prompt fragment loaded into every sub-agent's context plus a middleware classifier that detects ghostwriting patterns
- IN Learning mode the refusal SHALL be explained warmly ("I'm not going to give you the answer — you'll learn faster if you try first. Here's a nudge instead: ...")
- IN Professional mode the refusal SHALL be silent and curt ("Take your time. What's your read on it?")
- THE SYSTEM SHALL log all refusals as `scaffolding.refused` events for product analytics and rule tuning
- POST-session in Learning mode the system MAY explain what a strong answer would have included, framed as commentary, never as a script the user should memorize

### User story 14.2
As a developer or judge inspecting the product, I want the scaffolding rule to be visible in the spec and verifiable in the code.

**Acceptance criteria:**
- THE scaffolding rule SHALL be documented in `prompts/scaffold_refusal.md`
- A regression test in `services/orchestrator/eval/scaffolding_cases.yaml` SHALL include at minimum 25 ghostwriting attempts with expected refusal behavior; CI SHALL verify ≥ 95% refusal rate before deploy

---

## 15. Dashboard and history

### User story 15.1
As a user, I want a dashboard showing my progression, so I can see improvement and stay motivated.

**Acceptance criteria:**
- WHEN any session completes THE SYSTEM SHALL persist it with timestamp, duration, mode, persona, format, topics, scores, XP awarded
- THE dashboard SHALL show: current level + XP-to-next bar, current streak, session count, per-topic confidence sparkline, recent unlocks, 5 most recent sessions
- WHEN a user has 3+ interview sessions THE SYSTEM SHALL show trend indicators (improving, stable, declining) for filler rate, pace, content score, and confidence

---

## 16. Non-functional requirements

- **Latency:** Audio interview turn latency (user stops → AI begins) under 3 seconds at p95; pre-decision selection under 600 ms at p95
- **ASR quality:** Word error rate under 10% on clear English audio
- **Cold start:** Start clicked → first AI utterance under 8 seconds at p95
- **Coding round Run latency:** Click → result rendered under 4 seconds at p95
- **Research budget:** Background research completes within 30 seconds; if not, fall back without blocking session start
- **Graceful degradation:** Defined per external service in `steering/tech.md` — none of them takes the whole session down
- **Security:** PII and transcripts encrypted at rest (AES-256) and in transit (TLS 1.2+)
- **Data retention:** Audio retained 30 days by default; user-facing setting to delete immediately
- **Availability:** 99.5% uptime target
- **Cost ceiling:** Average paid session cost (LLM + ASR + TTS + emotion + research) under $0.60
- **Progression integrity:** XP, levels, streaks, achievements, unlocks computed server-side only; no client-trusted state
- **Event log completeness:** Every progression mutation, scaffolding refusal, and difficulty change persisted as immutable event for replay and audit
- **Scaffolding compliance:** ≥ 95% refusal rate on the ghostwriting regression eval set, enforced in CI
