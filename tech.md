# Tech

## Stack at a glance

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind | SSR for marketing, client islands for the interview UI, ecosystem maturity |
| Code editor (in-app) | CodeMirror 6 | Lightweight, embeddable, no autocomplete by design (mirrors real interviews) |
| Edge / WebSocket layer | Node.js 20 + Fastify | Efficient WebSocket fan-out for audio streams |
| Core services | Python 3.11 + FastAPI | Best-in-class ML/prompt ecosystems, clean async story |
| Session cache | Redis 7 | Sub-millisecond access for orchestrator state |
| Persistent data | PostgreSQL 16 + pgvector | Single source of truth, vector embeddings for question retrieval |
| Question bank (coding) | SQLite (local file) | LeetCode dataset is ~10k rows, fits in SQLite, no infra needed |
| Object storage | S3 (with KMS encryption) | Audio recordings, rendered reports |
| Code execution | Judge0 (self-hosted via Docker) | Open source, 50+ languages, isolated containers, REST API |
| Voice (TTS) | ElevenLabs streaming | Lowest latency, natural voice, streaming MP3 |
| Speech recognition (ASR) | Deepgram Nova-3 streaming (primary), Whisper v3-large (fallback) | Streaming throughput; Whisper for offline development |
| Reasoning LLM | Anthropic Claude Opus (primary), Sonnet (low-cost paths), GPT-4 (fallback) | Quality + cost mix; tool-use support for sub-agents |
| Voice emotion | Hume.ai Voice API | Confidence and hesitation signals not available from prosody alone |
| Objective prosody | librosa + parselmouth (Praat) | WPM, pause length, pitch range — purely numeric, no API call needed |
| Company research | Tavily Search API | Live company-specific interview signals beyond static profiles |
| Container orchestration | Docker Compose (dev), AWS ECS Fargate (prod) | Simplicity + standard production target |
| Database hosting | AWS RDS Postgres | Standard, supports pgvector |
| CI/CD | GitHub Actions | Repo-native, no extra service |

## Integration boundaries — what we depend on and what we do if it fails

| External service | Used for | Failure mode |
|---|---|---|
| ElevenLabs | TTS during interviews | Fall back to OpenAI TTS; if both fail, surface a maintenance message |
| Deepgram | Streaming ASR | Fall back to self-hosted Whisper; if both fail, switch session to text-input mode |
| Anthropic / OpenAI | All reasoning | Retry with the alternate provider; if both fail, end the session gracefully |
| Hume | Voice emotion analysis | Continue session without confidence/hesitation metrics; mark them as unavailable in the report rather than fabricate |
| Tavily | Company research | Fall back to the static company profile if available; otherwise use a generic role-tuned profile |
| Judge0 | Code execution | If the local instance is down, surface a clear error; do not run code remotely without explicit user consent |

## Hard constraints

- **No third-party fonts hosted off CDN.** Self-host fonts to avoid GDPR concerns and load latency.
- **No client-side state for progression.** XP, levels, streaks, achievements, and feature unlocks are server-computed and server-held only.
- **No autocomplete in the in-app code editor.** Intentional — the coding round mirrors real interview conditions.
- **No autoplay video or audio outside an active interview session.** Respect user attention.
- **No persistent storage of raw audio without user consent.** Default 30-day retention with an explicit setting to delete immediately.
- **No analytics SDKs that ship full session transcripts off-platform.** Use first-party analytics for behavioral events only.
- **No mocking of external APIs in production.** Tests use mocks; production has real fallbacks per the table above.

## Local development requirements

- Docker Desktop or compatible runtime
- Node 20+, Python 3.11+, pnpm
- Postgres 16 and Redis 7 (provided via docker-compose)
- API keys for: Anthropic, OpenAI, Deepgram, ElevenLabs, Hume, Tavily (a `.env.example` is checked in)
- Judge0 runs as a container in the dev compose stack
- The LeetCode SQLite database is downloaded once during `make setup` from the Hugging Face dataset

## Performance targets (these are testable)

- Audio interview turn latency (user stops → AI begins) under 3 seconds at p95
- ASR word error rate under 10% on clear English audio
- Cold session start (Start clicked → first AI utterance) under 8 seconds at p95
- Coding round Run-button latency (click → result rendered) under 4 seconds at p95
- Background research agent completes within the user's setup form interaction (target: 30 seconds budget)
- Cost per paid session ceiling: $0.60 across all external API calls
