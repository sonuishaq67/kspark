---
inclusion: always
---

# RoleReady AI — Product Steering

**Product:** RoleReady AI  
**One-liner:** Compare your resume to the job description, find your gaps, and practice the interview that matters — without getting answers ghostwritten for you.

> **Current State:** The project has a dual-backend architecture with the AI Core microservice fully operational, supporting six session types and voice-first interviews. The gap analysis and adaptive interview features described below are **planned for the RoleReady AI MVP** but not yet implemented.

## Target User
Students and early-career candidates who don't know what they're missing when preparing for interviews.

## Core Problem
Generic AI interview bots ask random questions or give scripted answers. Candidates memorize responses instead of building real skill.

## Our Approach
1. Start with the actual JD and resume — not generic questions.
2. Identify the specific gaps between what the role needs and what the candidate shows.
3. Run a mock interview that probes exactly those gaps.
4. Refuse to ghostwrite. Coach instead.
5. Give a learning-focused report, not a pass/fail score.

## Product Principles
- **Coach, don't ghostwrite.** The AI never writes a polished answer for the candidate to memorize.
- **Personalized, not generic.** Every interview is driven by the candidate's actual JD and resume.
- **Learning diagnosis, not judgment.** Scores and gaps are framed as growth opportunities.
- **Demo-safe.** The full flow must work without any API keys using mock mode.

## Demo Flow (Source of Truth)
Setup (JD + resume) → Gap Map → Prep Brief → Adaptive Interview → Ghostwriting Refusal → Final Report → Dashboard

## Current Working Features (AI Core)
The AI Core microservice (:8001) currently supports:
- **Six session types:** Full Interview, Behavioral Practice, Technical Concept Practice, Coding Practice, Resume Deep Dive, Custom Question
- **Voice-first interviews:** Real-time WebSocket with ElevenLabs TTS/STT
- **Ghostwriting guardrail:** Server-side refusal with coaching nudges
- **Session planning:** Phase-based interview structure with time management
- **Evaluation reports:** Rubric-based scoring with strengths, weaknesses, and action plans
- **Mock mode:** Full offline demo without API keys

## Planned RoleReady MVP Features (Not Yet Implemented)
- Gap analysis from JD + resume comparison
- Visual gap map with strong/partial/missing skills
- Adaptive question generation targeting specific gaps
- Three-panel interview UI with live gap tracking
- Multi-dimensional feedback report with gap closure tracking

## Out of Scope (Roadmap Only)
Live coding, XP/levels/streaks, recruiter dashboard, full auth, Postgres, Redis, voice-first mode, comparison against other candidates.
