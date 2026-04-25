#!/usr/bin/env bash

# RoleReady AI - local development shutdown helper.
#
# Stops the backend, AI Core, and Next.js services started by start.sh by using
# the same port configuration. Use --docker to stop Docker Compose services.

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
AI_CORE_PORT="${AI_CORE_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
USE_DOCKER=0
FORCE=0

red() { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[1;33m%s\033[0m\n' "$*"; }
blue() { printf '\033[0;34m%s\033[0m\n' "$*"; }

usage() {
  cat <<EOF
Usage: ./kill.sh [options]

Options:
  --docker   Stop Docker Compose services instead of local services
  --force    Send SIGKILL immediately instead of trying graceful shutdown first
  --help     Show this help

Local services:
  Backend   http://localhost:$BACKEND_PORT
  AI Core   http://localhost:$AI_CORE_PORT
  Frontend  http://localhost:$FRONTEND_PORT
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
  if [[ -f "$ROOT_DIR/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT_DIR/.env"
    set +a
  fi

  BACKEND_PORT="${BACKEND_PORT:-8000}"
  AI_CORE_PORT="${AI_CORE_PORT:-8001}"
  FRONTEND_PORT="${FRONTEND_PORT:-3000}"
}

collect_port_pids() {
  local port="$1"
  lsof -Pi ":$port" -sTCP:LISTEN -t 2>/dev/null | sort -u || true
}

collect_related_pids() {
  local port="$1"

  {
    collect_port_pids "$port"
    ps aux 2>/dev/null | awk -v root="$ROOT_DIR" -v port="$port" '
      index($0, root) && index($0, "--port " port) { print $2 }
    '
  } | sort -u
}

wait_for_port_free() {
  local port="$1"
  local attempts="${2:-10}"

  for _ in $(seq 1 "$attempts"); do
    if [[ -z "$(collect_port_pids "$port")" ]]; then
      return 0
    fi
    sleep 1
  done

  return 1
}

stop_port() {
  local name="$1"
  local port="$2"
  local pids=()

  while IFS= read -r pid; do
    [[ -n "$pid" ]] && pids+=("$pid")
  done < <(collect_related_pids "$port")

  if [[ "${#pids[@]}" -eq 0 ]]; then
    green "$name is not running on port $port"
    return 0
  fi

  blue "Stopping $name on port $port"
  printf '  pids %s\n' "${pids[*]}"

  if [[ "$FORCE" -eq 1 ]]; then
    kill -9 "${pids[@]}" >/dev/null 2>&1 || true
  else
    kill "${pids[@]}" >/dev/null 2>&1 || true
  fi

  if wait_for_port_free "$port"; then
    green "$name stopped"
    return 0
  fi

  yellow "$name did not stop gracefully. Sending SIGKILL."
  while IFS= read -r pid; do
    [[ -n "$pid" ]] && pids+=("$pid")
  done < <(collect_related_pids "$port")
  kill -9 "${pids[@]}" >/dev/null 2>&1 || true

  if wait_for_port_free "$port" 5; then
    green "$name stopped"
    return 0
  fi

  red "$name is still listening on port $port"
  return 1
}

stop_docker() {
  need_cmd docker

  cd "$ROOT_DIR"
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose down
  else
    docker compose down
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --docker) USE_DOCKER=1 ;;
      --force) FORCE=1 ;;
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
    stop_docker
    return
  fi

  need_cmd lsof
  load_env

  local failed=0
  stop_port "Backend" "$BACKEND_PORT" || failed=1
  stop_port "AI Core" "$AI_CORE_PORT" || failed=1
  stop_port "Frontend" "$FRONTEND_PORT" || failed=1

  if [[ "$failed" -eq 1 ]]; then
    exit 1
  fi

  green "RoleReady AI local services are stopped."
}

main "$@"
