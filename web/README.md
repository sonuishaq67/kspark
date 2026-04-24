# Web — Next.js 14 Frontend

This directory contains the Next.js 14 App Router frontend.

## Ownership by Route

### (p1)/ — Person 1
- `/onboarding` — Account creation, resume upload, JD parsing, role/company selection, diagnostic
- `/dashboard` — Level bar, streak, recent sessions, sparklines, trend indicators
- `/profile` — User profile and earned achievements
- `/settings` — Audio retention, notifications, role/company change

### (p2)/ — Person 2
- `/interview/[sessionId]` — Live voice interview (mic controls, transcript, AI indicator)
- `/report/[sessionId]` — Post-session feedback (radar chart, TLDR, full breakdown, 1-week plan)

### (p3)/ — Person 3
- `/practice` — Drill picker, attempt history, score deltas
- `/learn/[sessionId]` — Guided learning chat (SSE-streamed Socratic responses)
- `/code/[sessionId]` — Live coding round (CodeMirror 6, run/submit, test results)
- `/achievements` — Earned + locked achievements with criteria

## Component Ownership

### components/shared/ — 🔒 Shared (P1 seeds week 1)
- Button, Input, Layout, Nav
- After week 1, additions require group check

### components/p1/
- OnboardingWizard, ResearchBriefCard, DiagnosticQuiz, DashboardCard

### components/p2/
- MicControls, TranscriptView, RadarChart, FeedbackCard, VoicePlayer

### components/p3/
- DrillPicker, XPBar, AchievementBadge, CodeEditor, StreakIndicator

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts (for radar chart)
- CodeMirror 6 (for code editor)

## Getting Started

```bash
npm install
npm run dev
```

## API Client Generation

```bash
npm run generate:api
```

This reads `proto/*.yaml` and generates typed clients in `lib/api/`.

## Rules

1. **Never edit files in another person's route group**
2. **Shared components** — Check with team before adding to `components/shared/`
3. **API clients** — Auto-generated from proto, never hand-edit `lib/api/`
