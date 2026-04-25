#!/usr/bin/env bash
# RoleReady AI — start all 3 services (no conda needed)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT/.logs"
mkdir -p "$LOG_DIR" "$ROOT/data"

PIDS=()

cleanup() {
  echo ""
  echo "Stopping all services..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait "${PIDS[@]}" 2>/dev/null || true
  echo "Done."
}
trap cleanup EXIT INT TERM

# Load .env
if [[ -f "$ROOT/.env" ]]; then
  set -a; source "$ROOT/.env"; set +a
fi

# ── Backend (:8000) ──────────────────────────────────────────────────────────
echo "Starting backend on :8000..."
(
  cd "$ROOT/backend"
  if [[ -d .venv ]]; then source .venv/bin/activate; fi
  cp "$ROOT/.env" .env 2>/dev/null || true
  python -m uvicorn main:app --reload --port 8000
) > "$LOG_DIR/backend.log" 2>&1 &
PIDS+=($!)

# ── AI Core (:8001) ──────────────────────────────────────────────────────────
echo "Starting AI Core on :8001..."
(
  cd "$ROOT/ai-core"
  python -m uvicorn app.main:app --port 8001 --env-file "$ROOT/ai-core/.env"
) > "$LOG_DIR/ai-core.log" 2>&1 &
PIDS+=($!)

# ── Frontend (:3000) ─────────────────────────────────────────────────────────
echo "Starting frontend on :3000..."
(
  cd "$ROOT/web"
  npm run dev -- --port 3000
) > "$LOG_DIR/web.log" 2>&1 &
PIDS+=($!)

# ── Wait for services ────────────────────────────────────────────────────────
echo ""
echo "Waiting for services..."
for i in $(seq 1 30); do
  sleep 1
  B=$(curl -sf http://localhost:8000/health 2>/dev/null && echo "ok" || true)
  A=$(curl -sf http://localhost:8001/health 2>/dev/null && echo "ok" || true)
  F=$(curl -sf http://localhost:3000 -o /dev/null -w "%{http_code}" 2>/dev/null || true)
  if [[ "$B" == *"ok"* && "$A" == *"ok"* && ("$F" == "200" || "$F" == "307") ]]; then
    echo ""
    echo "✅ All services running:"
    echo "   Backend:  http://localhost:8000"
    echo "   AI Core:  http://localhost:8001"
    echo "   Frontend: http://localhost:3000"
    echo ""
    echo "   Logs: $LOG_DIR/"
    echo ""
    echo "Press Ctrl+C to stop all services."
    # Open browser on macOS
    open "http://localhost:3000" 2>/dev/null || true
    break
  fi
  printf "."
done

wait
