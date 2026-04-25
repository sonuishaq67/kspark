# Migration Guide: Virtual Environments → Conda

This guide helps you migrate from the old setup (separate `venv` in `backend/` and `ai-core/`) to the new unified conda environment.

---

## What Changed?

### Before (Old Setup)
```
roleready-ai/
├── backend/
│   ├── requirements.txt      ❌ Separate dependencies
│   └── .venv/                ❌ Separate virtual environment
│
├── ai-core/
│   ├── requirements.txt      ❌ Separate dependencies
│   └── .venv/                ❌ Separate virtual environment
│
└── requirements.txt          ❌ Outdated/unused
```

**Problems:**
- 😫 Had to activate different environments for each service
- 😫 Duplicate dependencies (fastapi, uvicorn, etc.)
- 😫 Version conflicts between services
- 😫 More complex setup for new developers

### After (New Setup)
```
roleready-ai/
├── environment.yml           ✅ Conda environment definition
├── requirements.txt          ✅ Single source of truth for all Python deps
│
├── backend/
│   └── (no .venv, no requirements.txt)
│
└── ai-core/
    └── (no .venv, no requirements.txt)
```

**Benefits:**
- ✅ Single conda environment for all Python code
- ✅ One activation command: `conda activate roleready`
- ✅ Unified dependency management
- ✅ Easier onboarding for new developers
- ✅ Consistent with best practices for multi-service Python projects

---

## Migration Steps

### Step 1: Clean Up Old Environments

```bash
# Remove old virtual environments
rm -rf backend/.venv
rm -rf ai-core/.venv

# Remove old requirements files (now consolidated)
rm -f backend/requirements.txt
rm -f ai-core/requirements.txt

# Clean Python cache
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete
```

### Step 2: Install Conda (if not already installed)

**macOS/Linux:**
```bash
# Download Miniconda installer
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh
bash Miniconda3-latest-MacOSX-x86_64.sh

# Or use Homebrew
brew install --cask miniconda
```

**Verify installation:**
```bash
conda --version
# Should output: conda 23.x.x or higher
```

### Step 3: Create Conda Environment

```bash
# Automated setup (recommended)
make setup

# Or manual setup
conda env create -f environment.yml
```

This creates a conda environment named `roleready` with Python 3.11 and all dependencies from `requirements.txt`.

### Step 4: Activate Environment

```bash
conda activate roleready
```

**Tip:** Add this to your shell profile for auto-activation:
```bash
# Add to ~/.bashrc or ~/.zshrc
alias roleready='cd ~/path/to/roleready-ai && conda activate roleready'
```

### Step 5: Verify Installation

```bash
# Check Python version
python --version
# Should output: Python 3.11.x

# Check installed packages
pip list | grep fastapi
# Should show: fastapi==0.111.0

# Check conda environment
conda info --envs
# Should show: roleready * (active)
```

### Step 6: Update Your Workflow

**Old workflow:**
```bash
# Terminal 1 (Backend)
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2 (AI Core)
cd ai-core
source .venv/bin/activate
PYTHONPATH=. uvicorn app.main:app --reload --port 8001
```

**New workflow:**
```bash
# One-time activation
conda activate roleready

# Then use the automated script
./start.sh

# Or start services manually
cd backend && uvicorn main:app --reload --port 8000
cd ai-core && PYTHONPATH=. uvicorn app.main:app --reload --port 8001
```

---

## Updated Commands Reference

### Environment Management

| Task | Old Command | New Command |
|------|-------------|-------------|
| Create environment | `python -m venv .venv` | `make setup` or `conda env create -f environment.yml` |
| Activate environment | `source .venv/bin/activate` | `conda activate roleready` |
| Deactivate environment | `deactivate` | `conda deactivate` |
| Install dependencies | `pip install -r requirements.txt` | `pip install -r requirements.txt` (same) |
| Remove environment | `rm -rf .venv` | `conda env remove -n roleready` |

### Running Services

| Task | Old Command | New Command |
|------|-------------|-------------|
| Start all services | `make dev` (with venv) | `conda activate roleready && ./start.sh` |
| Start backend | `cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000` | `conda activate roleready && cd backend && uvicorn main:app --reload --port 8000` |
| Start AI Core | `cd ai-core && source .venv/bin/activate && PYTHONPATH=. uvicorn app.main:app --reload --port 8001` | `conda activate roleready && cd ai-core && PYTHONPATH=. uvicorn app.main:app --reload --port 8001` |
| Run tests | `cd backend && source .venv/bin/activate && pytest` | `conda activate roleready && make test` |

### Makefile Commands

All Makefile commands now use the conda environment automatically:

```bash
make setup      # Create conda environment
make dev        # Start all services (requires conda env)
make backend    # Start backend only
make ai-core    # Start AI Core only
make web        # Start frontend only
make test       # Run tests
make clean      # Clean up Docker and data
```

---

## Troubleshooting

### Issue: `conda: command not found`

**Cause:** Conda is not installed or not in PATH.

**Solution:**
```bash
# Install Miniconda
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh
bash Miniconda3-latest-MacOSX-x86_64.sh

# Restart terminal or source profile
source ~/.bashrc  # or ~/.zshrc
```

### Issue: `Environment 'roleready' not found`

**Cause:** Conda environment not created yet.

**Solution:**
```bash
make setup
# or
conda env create -f environment.yml
```

### Issue: `ModuleNotFoundError` when running services

**Cause:** Conda environment not activated or dependencies not installed.

**Solution:**
```bash
conda activate roleready
pip install -r requirements.txt
```

### Issue: Old `.venv` directories still exist

**Cause:** Manual cleanup needed.

**Solution:**
```bash
rm -rf backend/.venv ai-core/.venv
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
```

### Issue: `make dev` fails with "environment not found"

**Cause:** Makefile expects conda environment to exist.

**Solution:**
```bash
make setup  # Creates the environment
conda activate roleready
make dev
```

### Issue: Services can't find modules from other directories

**Cause:** `PYTHONPATH` not set correctly.

**Solution:**
```bash
# For AI Core, always set PYTHONPATH
cd ai-core
PYTHONPATH=. uvicorn app.main:app --reload --port 8001

# Or use the start script which handles this automatically
./start.sh
```

---

## Team Communication

### For Team Members

**Announcement:**
> We've migrated from separate virtual environments to a unified conda environment. This simplifies our setup and makes onboarding easier.
>
> **Action required:**
> 1. Pull latest changes
> 2. Run `make setup` to create the conda environment
> 3. Use `conda activate roleready` instead of `source .venv/bin/activate`
> 4. See [CONDA_SETUP.md](./CONDA_SETUP.md) for full guide

### For New Contributors

**Updated onboarding:**
1. Install conda: https://docs.conda.io/en/latest/miniconda.html
2. Clone repo: `git clone <repo-url>`
3. Setup: `make setup`
4. Activate: `conda activate roleready`
5. Start: `./start.sh`

---

## Rollback (If Needed)

If you need to revert to the old setup:

```bash
# 1. Checkout old requirements files
git checkout HEAD~1 backend/requirements.txt
git checkout HEAD~1 ai-core/requirements.txt

# 2. Create virtual environments
cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cd ../ai-core && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt

# 3. Remove conda environment (optional)
conda env remove -n roleready
```

---

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Setup time** | ~5 minutes (2 venvs) | ~2 minutes (1 conda env) |
| **Activation** | 2 commands (per service) | 1 command (for all) |
| **Dependencies** | 2 files to maintain | 1 file to maintain |
| **Conflicts** | Possible version mismatches | Unified resolution |
| **Onboarding** | More complex | Simpler |
| **CI/CD** | Separate installs | Single install |

---

## Next Steps

1. ✅ Complete migration steps above
2. ✅ Test all services work correctly
3. ✅ Update your local scripts/aliases
4. ✅ Share this guide with team members
5. ✅ Update CI/CD pipelines (if applicable)

---

## Questions?

- Check [CONDA_SETUP.md](./CONDA_SETUP.md) for detailed setup guide
- Check [RUN_GUIDE.md](./RUN_GUIDE.md) for running services
- Ask in team chat or create an issue

---

**Happy migrating! 🚀**
