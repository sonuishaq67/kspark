#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

git -C "$ROOT_DIR" config core.hooksPath .githooks
chmod +x "$ROOT_DIR/.githooks/pre-commit"

printf 'Installed git hooks path: %s/.githooks\n' "$ROOT_DIR"
printf 'Pre-commit will now run the demo smoke test before each commit.\n'
