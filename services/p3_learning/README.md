# P3 Learning Services

**Owner:** Person 3

This directory contains all learning, coding, and progression services.

## Services

### practice/
Python + FastAPI
- Single-drill practice loop
- Drill config loader (`config/practice_drills.yaml`)
- Per-drill scoring breakdown
- Half-XP award + streak increment
- Attempt history tracking

### learning/
Python + FastAPI
- Guided learning engine
- Topic selector (lowest confidence, 24h cooldown)
- Socratic prompting (≤4 sentences, must end in question)
- Candidate model updates per turn
- SSE streaming for real-time responses

### coding/
Python + FastAPI
- Judge0 bridge (`POST /code/run`)
- LeetCode SQLite query layer
- Question selection (company, difficulty, topic filters)
- 30-day exclusion logic
- Coding sub-agent with editorial context
- Helpfulness levels (silent / hints / guided / full-walkthrough)

### progression/
Python + FastAPI
- XP calculator (`base × quality × difficulty + streak_bonus`)
- Level threshold function (`100 × level^1.5`)
- `session.completed` event handler
- Feature unlock population
- Streak service (timezone-aware, weekly freeze)
- Achievement rule evaluator (DSL from `config/achievements.yaml`)
- Difficulty manager (per-topic ±1 delta)
- Event-sourced progression store

## Dependencies

- Python 3.11+
- FastAPI
- SQLite3
- Judge0 (Docker)
- Postgres (for progression events)

## Getting Started

```bash
cd practice  # or learning, coding, progression
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Key Deliverables

**Week 1-2:** Practice service + drill configs + LeetCode import script
**Week 3-4:** Coding service + Judge0 bridge + learning engine
**Week 5-6:** Progression engine (XP, levels, streaks, achievements, difficulty)
**Week 7-8:** All UI pages + full-loop + stress mode + security tests
