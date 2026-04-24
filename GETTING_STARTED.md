# Getting Started — Interview Coach

Welcome to the Interview Coach project! This guide will help you get started quickly.

## Prerequisites

- Docker Desktop or compatible runtime
- Node.js 20+
- Python 3.11+
- pnpm (or npm)
- Git

## Quick Start

### 1. Clone and Setup

```bash
git clone <repo-url>
cd interview-coach
```

### 2. Environment Setup

Copy the example environment file:
```bash
cp .env.example .env
```

Add your API keys to `.env`:
```
# Required for all services
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
DEEPGRAM_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
HUME_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/interview_coach
REDIS_URL=redis://localhost:6379
```

### 3. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- Postgres 16 + pgvector
- Redis 7
- Judge0

### 4. Run Migrations

```bash
make migrate
```

### 5. Start Services

Each person starts their own services:

**Person 1:**
```bash
cd services/p1_platform/gateway && npm install && npm run dev
cd services/p1_platform/research && pip install -r requirements.txt && uvicorn main:app --reload
```

**Person 2:**
```bash
cd services/p2_interview/orchestrator && pip install -r requirements.txt && uvicorn main:app --reload
cd services/p2_interview/speech && pip install -r requirements.txt && uvicorn main:app --reload
```

**Person 3:**
```bash
cd services/p3_learning/practice && pip install -r requirements.txt && uvicorn main:app --reload
cd services/p3_learning/progression && pip install -r requirements.txt && uvicorn main:app --reload
```

### 6. Start Web Frontend

```bash
cd web
npm install
npm run dev
```

Visit http://localhost:3000

## Team Coordination

Read `TEAM_DIVISION.md` for ownership boundaries and sync points.

## Day 1 Checklist

- [ ] All 3 team members meet to agree on `proto/` contracts
- [ ] All 3 agree on `services/shared/` models
- [ ] P1 starts infra setup
- [ ] P2 starts prompt authoring
- [ ] P3 starts config authoring

## Need Help?

- Check `README.md` in each directory for specific guidance
- See `TEAM_DIVISION.md` for ownership questions
- Refer to spec files: `requirements.md`, `design.md`, `tasks.md`
