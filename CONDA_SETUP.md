# RoleReady AI — Conda Environment Setup Guide

This guide explains how to set up and run RoleReady AI using a single conda environment for all Python dependencies.

## Why Conda?

Instead of managing separate virtual environments for `backend/` and `ai-core/`, we now use a **single conda environment** with all dependencies consolidated in the root `requirements.txt`. This simplifies:

- ✅ Dependency management (one place for all Python packages)
- ✅ Environment activation (one command instead of multiple)
- ✅ Version conflicts (unified dependency resolution)
- ✅ Development workflow (consistent across all services)

---

## Prerequisites

1. **Conda** (Miniconda or Anaconda)
   - Install from: https://docs.conda.io/en/latest/miniconda.html
   - Verify: `conda --version`

2. **Node.js 18+** (for frontend)
   - Install from: https://nodejs.org/
   - Verify: `node --version`

3. **Git** (to clone the repository)
   - Verify: `git --version`

---

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd roleready-ai

# 2. Create conda environment and install dependencies
make setup

# 3. Activate the environment
conda activate roleready

# 4. Copy and configure environment variables
cp .env.example .env
# Edit .env and add your API keys (or leave MOCK_LLM=1 for demo mode)

# 5. Start all services
./start.sh
```

### Option 2: Manual Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd roleready-ai

# 2. Create conda environment from file
conda env create -f environment.yml

# 3. Activate the environment
conda activate roleready

# 4. Verify installation
python --version  # Should be 3.11
pip list | grep fastapi  # Should show fastapi==0.111.0

# 5. Copy and configure environment variables
cp .env.example .env

# 6. Start services manually (see below)
```

---

## Starting Services

### Option A: Automated Start (All Services)

```bash
conda activate roleready
./start.sh
```

This will:
- ✅ Check all prerequisites
- ✅ Verify conda environment
- ✅ Open 3 terminal windows (Backend, AI Core, Frontend)
- ✅ Start all services automatically
- ✅ Open browser to http://localhost:3000

### Option B: Manual Start (Individual Services)

Open 3 separate terminals:

**Terminal 1 — Backend (:8000)**
```bash
conda activate roleready
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 — AI Core (:8001)**
```bash
conda activate roleready
cd ai-core
PYTHONPATH=. uvicorn app.main:app --reload --port 8001 --env-file ../.env
```

**Terminal 3 — Frontend (:3000)**
```bash
cd web
npm install
npm run dev
```

### Option C: Using Makefile

```bash
# Start all services (requires conda environment)
make dev

# Or start individual services
make backend   # Backend only
make ai-core   # AI Core only
make web       # Frontend only
```

---

## Environment Configuration

### Mock Mode (No API Keys Required)

Perfect for demos and testing without external API dependencies:

```bash
# .env
MOCK_LLM=1
MOCK_ASR=1
MOCK_TTS=1
MOCK_STT=1
```

### Production Mode (Real APIs)

```bash
# .env
MOCK_LLM=0

# Backend (Legacy)
GROQ_API_KEY=your_groq_api_key_here
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# AI Core
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

---

## Dependency Management

### Adding New Dependencies

1. Add the package to `requirements.txt` (root level)
2. Update the conda environment:

```bash
conda activate roleready
pip install -r requirements.txt
```

### Updating Dependencies

```bash
conda activate roleready
pip install --upgrade -r requirements.txt
```

### Viewing Installed Packages

```bash
conda activate roleready
pip list
```

---

## Troubleshooting

### Issue: `conda: command not found`

**Solution:** Install conda from https://docs.conda.io/en/latest/miniconda.html

### Issue: `Environment 'roleready' not found`

**Solution:** Create the environment:
```bash
make setup
# or
conda env create -f environment.yml
```

### Issue: `ModuleNotFoundError: No module named 'fastapi'`

**Solution:** Install dependencies:
```bash
conda activate roleready
pip install -r requirements.txt
```

### Issue: Port already in use (8000, 8001, or 3000)

**Solution:** Kill the process using the port:
```bash
# macOS/Linux
lsof -ti:8000 | xargs kill -9
lsof -ti:8001 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Issue: `PYTHONPATH` not set correctly

**Solution:** Always set PYTHONPATH when running AI Core:
```bash
cd ai-core
PYTHONPATH=. uvicorn app.main:app --reload --port 8001
```

### Issue: Frontend can't connect to backend

**Solution:** Check `.env` file has correct URLs:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AI_CORE_URL=http://localhost:8001
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## Testing

### Run All Tests

```bash
conda activate roleready
make test
```

### Run Specific Test File

```bash
conda activate roleready
cd backend
pytest tests/test_orchestrator.py -v
```

### Run with Coverage

```bash
conda activate roleready
cd backend
pytest tests/ --cov=. --cov-report=html
```

---

## Conda Environment Management

### List All Environments

```bash
conda env list
```

### Activate Environment

```bash
conda activate roleready
```

### Deactivate Environment

```bash
conda deactivate
```

### Remove Environment

```bash
conda env remove -n roleready
```

### Export Environment (for sharing)

```bash
conda activate roleready
conda env export > environment-full.yml
```

---

## Migration from Old Setup

If you were using separate virtual environments (`backend/.venv` and `ai-core/.venv`):

### 1. Remove Old Virtual Environments

```bash
rm -rf backend/.venv
rm -rf ai-core/.venv
rm -rf backend/__pycache__
rm -rf ai-core/app/__pycache__
```

### 2. Create Conda Environment

```bash
make setup
```

### 3. Update Your Workflow

**Old way:**
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

**New way:**
```bash
conda activate roleready
cd backend
uvicorn main:app --reload --port 8000
```

---

## Docker Alternative

If you prefer Docker over conda:

```bash
# Build and start all services
docker-compose up --build

# Or use the start script
./start.sh --docker
```

Docker uses the same `requirements.txt` but manages environments via containers.

---

## Architecture Overview

```
roleready-ai/
├── environment.yml          # Conda environment definition
├── requirements.txt         # All Python dependencies (consolidated)
├── .env                     # Environment variables (API keys, ports)
├── Makefile                 # Build and run commands
├── start.sh                 # Automated startup script
│
├── backend/                 # Legacy backend (:8000)
│   ├── main.py
│   └── (no requirements.txt - uses root)
│
├── ai-core/                 # AI Core microservice (:8001)
│   ├── app/main.py
│   └── (no requirements.txt - uses root)
│
└── web/                     # Next.js frontend (:3000)
    ├── package.json
    └── (separate Node.js dependencies)
```

---

## Best Practices

1. **Always activate conda environment** before running Python commands
2. **Use `make` commands** for consistent workflow
3. **Keep `.env` file secure** (never commit API keys)
4. **Run tests** before committing changes
5. **Update `requirements.txt`** when adding new dependencies
6. **Use mock mode** for demos and CI/CD

---

## Additional Resources

- **Conda Documentation:** https://docs.conda.io/
- **FastAPI Documentation:** https://fastapi.tiangolo.com/
- **Next.js Documentation:** https://nextjs.org/docs
- **Project README:** [README.md](./README.md)
- **Run Guide:** [RUN_GUIDE.md](./RUN_GUIDE.md)

---

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Verify conda environment is activated: `conda info --envs`
3. Check service logs in terminal windows
4. Review `.env` configuration
5. Try mock mode first: `MOCK_LLM=1 ./start.sh`

---

**Happy coding! 🚀**
