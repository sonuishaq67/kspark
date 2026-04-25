---
inclusion: always
---

# RoleReady AI — Product Steering

**Product:** RoleReady AI  
**One-liner:** Compare your resume to the job description, find your gaps, and practice the interview that matters — without getting answers ghostwritten for you.

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

## Out of Scope (Roadmap Only)
Live coding, XP/levels/streaks, recruiter dashboard, full auth, Postgres, Redis, voice-first mode, comparison against other candidates.
