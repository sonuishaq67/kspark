.PHONY: help dev up down build logs test clean backend web ai-core

help:
	@echo "RoleReady AI — Hackathon Stack"
	@echo ""
	@echo "  make dev        - Run all 3 services locally (no Docker)"
	@echo "  make backend    - Run legacy backend on :8000"
	@echo "  make ai-core    - Run AI Core microservice on :8001"
	@echo "  make web        - Run Next.js frontend on :3000"
	@echo "  make up         - Start with Docker Compose"
	@echo "  make down       - Stop Docker Compose"
	@echo "  make build      - Build Docker images"
	@echo "  make logs       - Tail all container logs"
	@echo "  make test       - Run backend unit tests"
	@echo "  make clean      - Remove containers, volumes, SQLite file"
	@echo ""
	@echo "  MOCK_LLM=1 make dev   - Run without API keys (full mock mode)"

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

dev: backend ai-core web

backend:
	@echo "Starting legacy backend on :8000 ..."
	mkdir -p data
	cd backend && \
	  python -m venv .venv 2>/dev/null || true && \
	  . .venv/bin/activate && \
	  pip install -q -r requirements.txt && \
	  uvicorn main:app --reload --port 8000

ai-core:
	@echo "Starting AI Core on :8001 ..."
	cd ai-core && \
	  PYTHONPATH=. uvicorn app.main:app --reload --port 8001 --env-file .env

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
