#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT / "backend"
IGNORED_DIRS = {".git", ".pytest_cache", ".venv", "__pycache__"}
POLL_INTERVAL_SECONDS = 0.75
QUIET_PERIOD_SECONDS = 0.35


def iter_backend_python_files() -> list[Path]:
    files: list[Path] = []
    for path in BACKEND_DIR.rglob("*.py"):
        if any(part in IGNORED_DIRS for part in path.parts):
            continue
        files.append(path)
    return sorted(files)


def snapshot() -> dict[Path, int]:
    state: dict[Path, int] = {}
    for path in iter_backend_python_files():
        state[path] = path.stat().st_mtime_ns
    return state


def relpaths(paths: list[Path]) -> list[str]:
    return [str(path.relative_to(ROOT)) for path in paths]


def run_check(label: str, args: list[str]) -> int:
    print(f"\n[{timestamp()}] {label}")
    print(f"$ {' '.join(args)}")
    completed = subprocess.run(args, cwd=ROOT, check=False)
    status = "passed" if completed.returncode == 0 else "failed"
    print(f"[{timestamp()}] {label} {status} with exit code {completed.returncode}")
    return completed.returncode


def timestamp() -> str:
    return time.strftime("%H:%M:%S")


def main() -> int:
    print(f"[{timestamp()}] Watching {BACKEND_DIR} for Python file saves")
    print(f"[{timestamp()}] On each save: pylint changed files, then pytest backend/tests")
    known = snapshot()

    try:
        while True:
            time.sleep(POLL_INTERVAL_SECONDS)
            current = snapshot()
            changed = sorted(
                path for path, mtime in current.items()
                if known.get(path) != mtime
            )
            removed = sorted(set(known) - set(current))

            if not changed and not removed:
                continue

            time.sleep(QUIET_PERIOD_SECONDS)
            current = snapshot()
            changed = sorted(
                path for path, mtime in current.items()
                if known.get(path) != mtime
            )
            known = current

            if not changed:
                continue

            changed_relpaths = relpaths(changed)
            print(f"\n[{timestamp()}] Detected save: {', '.join(changed_relpaths)}")

            run_check(
                "Running pylint on changed backend files",
                [sys.executable, "-m", "pylint", *changed_relpaths],
            )
            run_check(
                "Running backend pytest suite",
                [
                    sys.executable,
                    "-m",
                    "pytest",
                    "-c",
                    "backend/pytest.ini",
                    "backend/tests",
                    "-q",
                    "--maxfail=1",
                ],
            )
    except KeyboardInterrupt:
        print(f"\n[{timestamp()}] Stopping backend save watcher")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
