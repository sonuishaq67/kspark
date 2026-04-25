# RoleReady AI — Quick Reference Card

## 🚀 First Time Setup

```bash
git clone <repo-url>
cd roleready-ai
make setup                    # Creates conda environment
conda activate roleready      # Activate environment
cp .env.example .env          # Configure (optional for mock mode)
./start.sh                    # Start all services
```

---

## 📦 Conda Environment

```bash
# Create environment
make setup
# or: conda env create -f environment.yml

# Activate
conda activate roleready

# Deactivate
conda deactivate

# List environments
conda env list

# Remove environment
conda env remove -n roleready

# Update dependencies
conda activate roleready
pip install -r requirements.txt
```

---

## 🏃 Running Services

### Automated (Recommended)
```bash
conda activate roleready
./start.sh                    # Opens 3 terminals + browser
```

### Using Makefile
```bash
make dev                      # All services
make backend                  # Backend only (:8000)
make ai-core                  # AI Core only (:8001)
make web                      # Frontend only (:3000)
```

### Manual
```bash
# Terminal 1 - Backend
conda activate roleready
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 - AI Core
conda activate roleready
cd ai-core
PYTHONPATH=. uvicorn app.main:app --reload --port 8001 --env-file ../.env

# Terminal 3 - Frontend
cd web
npm install
npm run dev
```

---

## 🐳 Docker Alternative

```bash
docker-compose up --build     # Build and start
docker-compose down           # Stop
docker-compose logs -f        # View logs
./start.sh --docker           # Use start script with Docker
```

---

## 🧪 Testing

```bash
conda activate roleready
make test                     # Run all tests
cd backend && pytest tests/   # Run backend tests only
pytest tests/test_file.py -v  # Run specific test file
```

---

## 🔧 Configuration

### Mock Mode (No API Keys)
```bash
# .env
MOCK_LLM=1
MOCK_ASR=1
MOCK_TTS=1
MOCK_STT=1
```

### Production Mode
```bash
# .env
MOCK_LLM=0
GROQ_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
DEEPGRAM_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
```

---

## 📍 Service URLs

| Service | URL | Health Check |
|---------|-----|--------------|
| Frontend | http://localhost:3000 | - |
| Backend | http://localhost:8000 | http://localhost:8000/health |
| AI Core | http://localhost:8001 | http://localhost:8001/health |
| Backend Docs | http://localhost:8000/docs | - |
| AI Core Docs | http://localhost:8001/docs | - |

---

## 🛠️ Common Tasks

### Add New Python Dependency
```bash
# 1. Add to requirements.txt (root)
echo "new-package==1.0.0" >> requirements.txt

# 2. Install
conda activate roleready
pip install -r requirements.txt
```

### Clean Up
```bash
make clean                    # Remove Docker containers + DB
rm -rf data/*.db              # Remove database files
rm -rf backend/__pycache__    # Remove Python cache
rm -rf .next/                 # Remove Next.js cache
```

### Kill Port
```bash
lsof -ti:8000 | xargs kill -9  # Kill backend
lsof -ti:8001 | xargs kill -9  # Kill AI Core
lsof -ti:3000 | xargs kill -9  # Kill frontend
```

### View Logs
```bash
# Docker
docker-compose logs -f

# Local (check terminal windows)
# Or redirect to files:
uvicorn main:app --reload --port 8000 > backend.log 2>&1 &
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `conda: command not found` | Install conda: https://docs.conda.io/en/latest/miniconda.html |
| `Environment 'roleready' not found` | Run `make setup` |
| `ModuleNotFoundError` | Run `conda activate roleready && pip install -r requirements.txt` |
| Port already in use | Run `lsof -ti:PORT \| xargs kill -9` |
| Frontend can't connect | Check `.env` has correct URLs |
| `PYTHONPATH` error | Use `PYTHONPATH=. uvicorn ...` for AI Core |

---

## 📚 Documentation

- **Setup Guide:** [CONDA_SETUP.md](./CONDA_SETUP.md)
- **Migration Guide:** [MIGRATION_TO_CONDA.md](./MIGRATION_TO_CONDA.md)
- **Run Guide:** [RUN_GUIDE.md](./RUN_GUIDE.md)
- **Testing Guide:** [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Demo Script:** [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
- **Main README:** [README.md](./README.md)

---

## 🎯 Project Structure

```
roleready-ai/
├── environment.yml           # Conda environment
├── requirements.txt          # All Python dependencies
├── .env                      # Environment variables
├── Makefile                  # Build commands
├── start.sh                  # Startup script
│
├── backend/                  # Legacy backend (:8000)
│   ├── main.py
│   ├── api/
│   ├── db/
│   ├── llm/
│   └── orchestrator/
│
├── ai-core/                  # AI Core microservice (:8001)
│   ├── app/
│   │   ├── main.py
│   │   ├── agents/
│   │   ├── core/
│   │   └── services/
│   └── prompts/
│
└── web/                      # Next.js frontend (:3000)
    ├── app/
    ├── components/
    └── lib/
```

---

## 💡 Tips

1. **Always activate conda environment** before running Python commands
2. **Use `./start.sh`** for easiest startup experience
3. **Use mock mode** for demos and testing without API keys
4. **Check health endpoints** to verify services are running
5. **Use `make` commands** for consistent workflow
6. **Keep `.env` secure** - never commit API keys

---

## 🔗 Quick Links

- **Conda Docs:** https://docs.conda.io/
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **Next.js Docs:** https://nextjs.org/docs
- **Groq API:** https://console.groq.com/
- **OpenAI API:** https://platform.openai.com/

---

**Print this page for quick reference! 📄**
