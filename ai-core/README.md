# AI Core — Interview & Practice Engine

Reusable AI microservice powering mock interviews and targeted practice sessions for RoleReady AI.

## Supported Session Types

| Type | Description | Default Duration |
|------|-------------|-----------------|
| `FULL_INTERVIEW` | Complete mock interview (behavioral + technical + coding) | 60 min |
| `BEHAVIORAL_PRACTICE` | Targeted behavioral question practice | 15 min |
| `TECHNICAL_CONCEPT_PRACTICE` | Explain and defend a technical concept | 20 min |
| `CODING_PRACTICE` | LeetCode-style coding round with follow-ups | 45 min |
| `RESUME_DEEP_DIVE` | Deep probe of resume projects and ownership | 30 min |
| `CUSTOM_QUESTION` | Focused mini-interview around a custom question | 15 min |

## Local Setup

### 1. Install dependencies

```bash
cd ai-core
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and add your API keys
```

To run without any API keys (full mock mode):
```bash
MOCK_LLM=1 MOCK_TTS=1 MOCK_STT=1 uvicorn app.main:app --reload --port 8001
```

### 3. Start the server

```bash
uvicorn app.main:app --reload --port 8001
```

API docs available at: http://localhost:8001/docs

---

## Quick Test (Text Mode)

### Start a behavioral practice session

```bash
curl -X POST http://localhost:8001/sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "session_type": "BEHAVIORAL_PRACTICE",
    "duration_minutes": 15,
    "mode": "learning",
    "focus_area": "tell me about yourself",
    "company": "Google",
    "role_type": "SDE2"
  }'
```

Response:
```json
{
  "session_id": "abc-123",
  "intro_message": "Hi! Let's practice your 'tell me about yourself' response...",
  "session_type": "BEHAVIORAL_PRACTICE",
  "mode": "learning",
  "duration_minutes": 15,
  "phases": ["INTRODUCTION_OR_PROMPT", "BEHAVIORAL_RESPONSE", "FOLLOWUPS", "FEEDBACK"]
}
```

### Submit a turn (text mode)

```bash
curl -X POST http://localhost:8001/sessions/abc-123/text-test \
  -H "Content-Type: application/json" \
  -d '{"transcript": "I am a software engineer with 3 years of experience..."}'
```

### End session and get report

```bash
curl -X POST http://localhost:8001/sessions/abc-123/end
```

---

## Architecture

```
app/
├── main.py                  # FastAPI entry point
├── config.py                # Settings (pydantic-settings)
│
├── api/
│   ├── sessions.py          # REST endpoints
│   └── websocket.py         # WebSocket handler (real-time)
│
├── core/
│   ├── orchestrator.py      # Central coordinator — owns session lifecycle
│   ├── session_planner.py   # Converts session_type + context → SessionPlan
│   ├── context_loader.py    # Parses upstream context file
│   └── memory.py            # Rolling conversation summary
│
├── graphs/
│   └── interview_graph.py   # LangGraph orchestration graph
│
├── agents/
│   ├── question_generator.py  # Background question generation
│   ├── followup_selector.py   # Fast follow-up selection
│   ├── response_generator.py  # Streaming response + guardrail
│   └── evaluator.py           # End-of-session report
│
├── services/
│   ├── openai_service.py    # OpenAI wrapper (streaming + JSON mode)
│   ├── tts_service.py       # ElevenLabs TTS abstraction
│   └── stt_service.py       # STT abstraction (ElevenLabs / Whisper)
│
├── models/
│   ├── session.py           # InterviewSession, SessionPlan, TurnRecord
│   ├── events.py            # WebSocket event models
│   └── evaluation.py        # EvaluationReport
│
├── utils/
│   ├── prompts.py           # Prompt template loader
│   ├── latency.py           # Turn latency tracking
│   └── logging.py           # Logging setup
│
prompts/
├── interviewer.md           # Core interviewer behavior
├── session_planner.md       # Session plan generation
├── question_generator.md    # Background question generation
├── followup_selector.md     # Fast follow-up selection
├── evaluator.md             # General evaluation report
└── coding_evaluator.md      # Coding-specific evaluation
```

## Latency Strategy

Target: candidate stops speaking → interviewer starts responding in **< 2-3 seconds**

1. **Pre-emptive question generation** — `generate_candidate_questions` fires as background task on every `transcript_chunk` event while the user is still speaking
2. **Fast follow-up selection** — `select_best_followup` uses `gpt-4o-mini` for a small, fast call
3. **Streaming response** — `generate_response_stream` streams tokens as they arrive
4. **Streaming TTS** — ElevenLabs `eleven_turbo_v2_5` streams audio chunks

Latency metrics are tracked per turn and sent to the client via `latency_metrics` WebSocket event.

## WebSocket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `speech_started` | — | User started speaking |
| `transcript_chunk` | `{text, is_final}` | Partial transcript |
| `speech_ended` | `{final_transcript}` | User stopped speaking |
| `audio_chunk` | `{data: base64}` | Raw audio for STT |
| `code_update` | `{code, language}` | Code editor update |
| `mode_update` | `{mode}` | Switch learning/professional |
| `end_session` | — | End session |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `interviewer_text_delta` | `{delta, is_final}` | Streaming text token |
| `interviewer_audio_chunk` | `{data: base64}` | Streaming TTS audio |
| `selected_question` | `{question, phase}` | Which question was selected |
| `phase_update` | `{phase, description, ...}` | Phase transition |
| `timer_update` | `{time_remaining_seconds}` | Time remaining |
| `report_ready` | `{session_id, report}` | Report generated |
| `latency_metrics` | `{...ms}` | Turn timing metrics |
| `error` | `{code, message}` | Error |

## Mock Mode

Run the full service without any API keys:

```bash
MOCK_LLM=1 MOCK_TTS=1 MOCK_STT=1 uvicorn app.main:app --reload --port 8001
```

All LLM calls return deterministic mock responses. TTS returns empty audio. STT returns a placeholder transcript.

Check mock status:
```bash
curl http://localhost:8001/health
```
