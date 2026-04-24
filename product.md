# Product

## Vision

Interview Coach is a voice-driven AI interview preparation platform that puts candidates through realistic, end-to-end mock interviews — including live coding — and scores them across eight dimensions of performance. It is a flight simulator for job interviews, not a quiz app or a chatbot.

The product distinguishes itself from existing tools through five concrete bets, each of which shapes architecture decisions throughout the spec.

## Bet 1: The orchestrator actually listens

The most-cited complaint about existing AI interview tools is that the AI doesn't track the conversation — it loops on resolved questions, moves on from vague answers without probing, and feels like a script reading itself. The product's response is a stateful orchestrator that owns session state, a thread tracker, and a per-question sub-agent pattern. The LLM is invoked only for stateless reasoning calls (classify a turn, generate a probe, summarize for handoff). State lives in the orchestrator, not in prompts.

A second-order effect of this design is the **streaming pre-decision** behavior: while the candidate is still speaking, the active sub-agent analyzes the partial transcript and ranks possible follow-ups. By the time the candidate stops, the next utterance is already chosen. There is no awkward thinking pause. This is what makes the interaction feel human.

## Bet 2: Scaffolding, not ghostwriting

The agent is explicitly designed as a sparring partner, not a script writer. If the candidate asks "just tell me what to say," the agent refuses and offers a Socratic hint instead. This rule lives in shared prompt fragments, in the spec, and in a small middleware that intercepts known ghostwriting patterns. It applies in every mode including Learning mode (where the agent may explain what a strong answer would have included after the candidate's attempt, but never preempts the attempt).

This is a product principle, not a feature. It is what makes the product educationally defensible and worth using twice.

## Bet 3: Progression is earned

The product uses XP, levels, streaks, and achievements — but every progression event is grounded in demonstrated skill against a per-user candidate model. Levels unlock features (harder personas, company profiles, full-loop simulation, stress mode). XP scales with content quality, session difficulty, and streak — not with raw session count. Achievements are tied to skill milestones ("ace a behavioral question on the first probe") rather than time spent.

This is the difference between a system that feels like a slot machine and one that feels like a dojo.

## Bet 4: The spec is the product

Personas, company profiles, achievement criteria, scoring rubrics, scaffolding rules, mode definitions, and round structures all live in version-controlled YAML configs. Editing a config changes product behavior without a code change. This makes the product genuinely tunable post-launch and is the reason a Kiro spec drives the build cleanly — the spec encodes intent, the configs encode tuning, the code encodes the runtime.

## Bet 5: Local where it should be

The code execution sandbox (Judge0 via Docker), the LeetCode question bank (SQLite), and the session state cache (Redis) all run locally. The product depends on four external services: ElevenLabs for voice, Anthropic for reasoning, Hume for voice emotion, and Tavily for company research. Each is swappable at the integration boundary, and degraded operation is defined for each (see the design doc).

## Target users

**Primary:** Final-year computer science students and early-career software engineers (zero to two years of experience) preparing for placement, new-grad, or first lateral interviews.

**Secondary:** Mid-level engineers (three to five years of experience) preparing for senior-leveling interviews at FAANG-tier companies, particularly those preparing for non-coding rounds (behavioral, system design, technical concepts).

**Not the user:** Candidates seeking real-time copilot help during actual interviews. The product is explicitly a practice tool. Real-time-during-interview tools exist; they are out of scope and out of intent.

## Two modes shape every interaction

**Learning mode** — Patient interviewer. Explains what good answers look like after the candidate's attempt. Offers hints when the candidate is stuck. Scoring is advisory rather than judgmental. Targeted at first-timers, career switchers, and anyone learning a new role.

**Professional mode** — No hints. Formal interviewer throughout. Probes hard on every gap. Scoring is strict. Mirrors a real FAANG-tier loop. Targeted at final prep and readiness calibration. Both modes still respect the scaffolding principle — Professional mode just refuses ghostwriting silently rather than explaining why.

## Pricing intuition (not a commitment)

Free tier with daily session limits and basic personas. Paid tier unlocks unlimited sessions, company-specific profiles, full-loop simulation, stress mode, and the Tavily-powered live research. The cost ceiling for a paid session (LLM + ASR + TTS + emotion + research) is set at $0.60 to support a sustainable freemium economy.
