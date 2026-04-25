.PHONY: help setup dev up down build logs test clean backend web ai-core

help:
	@echo "RoleReady AI — Hackathon Stack"
	@echo ""
	@echo "Setup (first time):"
	@echo "  make setup      - Create conda environment and install dependencies"
	@echo ""
	@echo "Local development (conda):"
	@echo "  make dev        - Run all 3 services locally (no Docker)"
	@echo "  make backend    - Run legacy backend on :8000"
	@echo "  make ai-core    - Run AI Core microservice on :8001"
	@echo "  make web        - Run Next.js frontend on :3000"
	@echo ""
	@echo "Docker:"
	@echo "  make up         - Start with Docker Compose"
	@echo "  make down       - Stop Docker Compose"
	@echo "  make build      - Build Docker images"
	@echo "  make logs       - Tail all container logs"
	@echo ""
	@echo "Testing & Cleanup:"
	@echo "  make test       - Run backend unit tests"
	@echo "  make clean      - Remove containers, volumes, SQLite file"
	@echo ""
	@echo "Options:"
	@echo "  MOCK_LLM=1 make dev   - Run without API keys (full mock mode)"

# ── Setup ────────────────────────────────────────────────────────────────────

setup:
	@echo "Creating conda environment 'roleready'..."
	@if conda env list | grep -q "^roleready "; then \
		echo "Environment 'roleready' already exists. Updating dependencies..."; \
		conda run -n roleready python -m pip install -r requirements.txt; \
	else \
		conda env create -f environment.yml; \
	fi
	@echo ""
	@echo "✓ Setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. conda activate roleready"
	@echo "  2. cp .env.example .env  (and fill in API keys)"
	@echo "  3. make dev"

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

# ── Local dev (conda environment) ────────────────────────────────────────────

dev: backend ai-core web

backend:
	@echo "Starting legacy backend on :8000 ..."
	@if ! conda env list | grep -q "^roleready "; then \
		echo "Error: conda environment 'roleready' not found. Run 'make setup' first."; \
		exit 1; \
	fi
	mkdir -p data
	cd backend && conda run -n roleready --no-capture-output python -m uvicorn main:app --reload --port 8000

ai-core:
	@echo "Starting AI Core on :8001 ..."
	@if ! conda env list | grep -q "^roleready "; then \
		echo "Error: conda environment 'roleready' not found. Run 'make setup' first."; \
		exit 1; \
	fi
	cd ai-core && conda run -n roleready --no-capture-output env PYTHONPATH=. python -m uvicorn app.main:app --reload --port 8001 --env-file ../.env

web:
	@echo "Starting frontend on :3000 ..."
	cd web && npm install --silent && npm run dev

# ── Tests ────────────────────────────────────────────────────────────────────

test:
	@if ! conda env list | grep -q "^roleready "; then \
		echo "Error: conda environment 'roleready' not found. Run 'make setup' first."; \
		exit 1; \
	fi
	cd backend && conda run -n roleready pytest tests/ -v

# ── Cleanup ──────────────────────────────────────────────────────────────────

clean:
	docker-compose down -v
	rm -f data/interview_coach.db
	@echo "Cleaned."
