.PHONY: help dev up down build logs test clean backend web

help:
	@echo "Interview Coach — Hackathon Stack"
	@echo ""
	@echo "  make dev        - Run backend + frontend locally (no Docker)"
	@echo "  make up         - Start with Docker Compose"
	@echo "  make down       - Stop Docker Compose"
	@echo "  make build      - Build Docker images"
	@echo "  make logs       - Tail all container logs"
	@echo "  make test       - Run backend unit tests"
	@echo "  make clean      - Remove containers, volumes, SQLite file"
	@echo ""
	@echo "  MOCK_ASR=1 make dev   - Run without Deepgram (offline mode)"
	@echo "  MOCK_TTS=1 make dev   - Run without ElevenLabs (text-only mode)"

# ── Docker ───────────────────────────────────────────────────────────────────

build:
	docker-compose build

up:
	mkdir -p data
	docker-compose up

up-detached:
	mkdir -p data
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

# ── Local dev (no Docker) ────────────────────────────────────────────────────

dev: backend web

backend:
	@echo "Starting backend on :8000 ..."
	mkdir -p data
	cd backend && \
	  python -m venv .venv 2>/dev/null || true && \
	  . .venv/bin/activate && \
	  pip install -q -r requirements.txt && \
	  uvicorn main:app --reload --port 8000

web:
	@echo "Starting frontend on :3000 ..."
	cd web && npm install --silent && npm run dev

# ── Tests ────────────────────────────────────────────────────────────────────

test:
	cd backend && \
	  . .venv/bin/activate 2>/dev/null || python -m venv .venv && . .venv/bin/activate && \
	  pip install -q -r requirements.txt && \
	  pytest tests/ -v

# ── Cleanup ──────────────────────────────────────────────────────────────────

clean:
	docker-compose down -v
	rm -f data/interview_coach.db
	@echo "Cleaned."
