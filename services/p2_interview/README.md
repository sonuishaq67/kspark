# P2 Interview Services

**Owner:** Person 2

This directory contains all interview orchestration and voice processing services.

## Services

### orchestrator/
Python + FastAPI
- Multi-agent state machine (PLANNING → INTRO → RUNNING → CLOSING)
- Sub-agent lifecycle management
- Thread tracker (gap tracking, probe counting)
- Question selection and planning
- Session state management (Redis-backed)
- Feedback generation orchestration

### speech/
Python + FastAPI
- Deepgram ASR streaming integration
- VAD (Voice Activity Detection) with silero-vad
- ElevenLabs TTS streaming with barge-in support
- Hume Voice emotion analysis
- librosa + parselmouth prosody analysis
- TurnSignals event emission

### scaffolding/
Python module (part of orchestrator)
- Ghostwriting pattern detection (regex + LLM)
- Refusal enforcement middleware
- Mode-aware refusal tone (warm in Learning, curt in Professional)
- Event logging for analytics
- CI regression eval (25+ cases, ≥95% refusal rate)

## Dependencies

- Python 3.11+
- FastAPI
- Redis
- Deepgram SDK
- ElevenLabs SDK
- Hume SDK
- librosa
- parselmouth
- silero-vad

## Getting Started

```bash
cd orchestrator  # or speech
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Key Deliverables

**Week 3-4:** Speech pipeline (ASR + VAD + TTS + prosody + Hume)
**Week 5-6:** Orchestrator + sub-agents + thread tracker + streaming pre-decision
**Week 7-8:** Feedback generation + scaffolding enforcement + latency benchmarks
