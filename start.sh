#!/usr/bin/env bash

# RoleReady AI - local development supervisor.
#
# Starts backend, AI Core, and Next.js from one shell using the shared
# `roleready` conda environment. Python dependencies come only from the root
# requirements.txt / environment.yml files.

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_NAME="${CONDA_ENV_NAME:-roleready}"
LOG_DIR="$ROOT_DIR/.logs"
BACKEND_PORT="${BACKEND_PORT:-8000}"
AI_CORE_PORT="${AI_CORE_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
OPEN_BROWSER=1
USE_DOCKER=0
SKIP_SETUP=0

PIDS=()

red() { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[1;33m%s\033[0m\n' "$*"; }
blue() { printf '\033[0;34m%s\033[0m\n' "$*"; }

usage() {
  cat <<EOF
Usage: ./start.sh [options]

Options:
  --docker       Start Docker Compose instead of local services
  --no-browser   Do not open the browser
  --skip-setup   Do not create/update the conda env or install npm packages
  --help         Show this help

Local services:
  Backend   http://localhost:$BACKEND_PORT
  AI Core   http://localhost:$AI_CORE_PORT
  Frontend  http://localhost:$FRONTEND_PORT

Logs:
  .logs/backend.log
  .logs/ai-core.log
  .logs/web.log
EOF
}

die() {
  red "Error: $*"
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is not installed or not on PATH"
}

load_env() {
  if [[ ! -f "$ROOT_DIR/.env" ]]; then
    yellow "No .env found. Creating one from .env.example."
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
  fi

  # Export root .env so Next.js gets NEXT_PUBLIC_* and both Python services get
  # provider/mock settings. Lines are simple KEY=VALUE entries by convention.
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a

  BACKEND_PORT="${BACKEND_PORT:-8000}"
  AI_CORE_PORT="${AI_CORE_PORT:-8001}"
  FRONTEND_PORT="${FRONTEND_PORT:-3000}"
}

port_in_use() {
  lsof -Pi ":$1" -sTCP:LISTEN -t >/dev/null 2>&1
}

assert_ports_free() {
  local busy=0
  for port in "$BACKEND_PORT" "$AI_CORE_PORT" "$FRONTEND_PORT"; do
    if port_in_use "$port"; then
      red "Port $port is already in use."
      busy=1
    fi
  done

  if [[ "$busy" -eq 1 ]]; then
    cat <<EOF

Stop the existing service or free the port, then run ./start.sh again.
Useful commands:
  lsof -i :$BACKEND_PORT
  lsof -i :$AI_CORE_PORT
  lsof -i :$FRONTEND_PORT
EOF
    exit 1
  fi
}

conda_env_exists() {
  conda env list | awk '{print $1}' | grep -qx "$ENV_NAME"
}

setup_python() {
  need_cmd conda

  if [[ "$SKIP_SETUP" -eq 1 ]]; then
    conda_env_exists || die "conda env '$ENV_NAME' not found. Run make setup or ./start.sh without --skip-setup."
    return
  fi

  if conda_env_exists; then
    blue "Updating conda env '$ENV_NAME' from root requirements.txt"
    conda run -n "$ENV_NAME" python -m pip install -q -r "$ROOT_DIR/requirements.txt"
  else
    blue "Creating conda env '$ENV_NAME' from environment.yml"
    conda env create -f "$ROOT_DIR/environment.yml"
  fi

  conda run -n "$ENV_NAME" python -c "import fastapi, uvicorn, openai" \
    || die "Python dependency verification failed for conda env '$ENV_NAME'"
}

setup_frontend() {
  need_cmd npm

  if [[ "$SKIP_SETUP" -eq 1 ]]; then
    return
  fi

  if [[ ! -d "$ROOT_DIR/web/node_modules" ]]; then
    blue "Installing frontend dependencies"
    (cd "$ROOT_DIR/web" && npm install --silent)
  fi
}

start_service() {
  local name="$1"
  local workdir="$2"
  local logfile="$3"
  shift 3

  blue "Starting $name"
  (
    cd "$workdir"
    exec "$@"
  ) >"$logfile" 2>&1 &

  local pid=$!
  PIDS+=("$pid")
  printf '  pid %-8s log %s\n' "$pid" "$logfile"
}

wait_for_http() {
  local name="$1"
  local url="$2"
  local logfile="$3"
  local attempts="${4:-40}"

  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      green "$name is ready: $url"
      return 0
    fi
    sleep 1
  done

  red "$name did not become ready: $url"
  echo "Last 40 log lines from $logfile:"
  tail -40 "$logfile" || true
  return 1
}

cleanup() {
  if [[ "${#PIDS[@]}" -gt 0 ]]; then
    echo
    yellow "Stopping services..."
    for pid in "${PIDS[@]}"; do
      kill "$pid" >/dev/null 2>&1 || true
    done
    wait "${PIDS[@]}" >/dev/null 2>&1 || true
  fi
}

open_browser() {
  [[ "$OPEN_BROWSER" -eq 1 ]] || return 0

  local url="http://localhost:$FRONTEND_PORT"
  case "$(uname -s)" in
    Darwin*) open "$url" >/dev/null 2>&1 || true ;;
    Linux*) xdg-open "$url" >/dev/null 2>&1 || true ;;
    *) blue "Open $url" ;;
  esac
}

start_docker() {
  need_cmd docker
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose up --build
  else
    docker compose up --build
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --docker) USE_DOCKER=1 ;;
      --no-browser) OPEN_BROWSER=0 ;;
      --skip-setup) SKIP_SETUP=1 ;;
      --help) usage; exit 0 ;;
      *) usage; die "unknown option: $1" ;;
    esac
    shift
  done
}

main() {
  parse_args "$@"
  cd "$ROOT_DIR"

  if [[ "$USE_DOCKER" -eq 1 ]]; then
    load_env
    start_docker
    return
  fi

  need_cmd curl
  need_cmd lsof
  need_cmd node
  need_cmd npm
  load_env
  setup_python
  setup_frontend
  mkdir -p "$LOG_DIR" "$ROOT_DIR/data"
  assert_ports_free

  trap cleanup EXIT INT TERM

  start_service "backend" "$ROOT_DIR/backend" "$LOG_DIR/backend.log" \
    conda run -n "$ENV_NAME" --no-capture-output python -m uvicorn main:app \
      --reload --port "$BACKEND_PORT" --env-file "$ROOT_DIR/.env"

  start_service "AI Core" "$ROOT_DIR/ai-core" "$LOG_DIR/ai-core.log" \
    conda run -n "$ENV_NAME" --no-capture-output env PYTHONPATH=. python -m uvicorn app.main:app \
      --reload --port "$AI_CORE_PORT" --env-file "$ROOT_DIR/.env"

  start_service "frontend" "$ROOT_DIR/web" "$LOG_DIR/web.log" \
    npm run dev -- --port "$FRONTEND_PORT"

  wait_for_http "Backend" "http://localhost:$BACKEND_PORT/health" "$LOG_DIR/backend.log"
  wait_for_http "AI Core" "http://localhost:$AI_CORE_PORT/health" "$LOG_DIR/ai-core.log"
  wait_for_http "Frontend" "http://localhost:$FRONTEND_PORT" "$LOG_DIR/web.log"

  green "RoleReady AI is running at http://localhost:$FRONTEND_PORT"
  blue "Press Ctrl+C to stop all services."
  open_browser

  wait
}

main "$@"
