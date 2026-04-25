"""
Prompt template loader.
Reads .md files from ai-core/prompts/ at startup.
"""
from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Resolve prompts/ relative to this file: ai-core/app/utils/ → ai-core/prompts/
_PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"

_cache: dict[str, str] = {}


def _load_all() -> None:
    if not _PROMPTS_DIR.exists():
        logger.warning("prompts/ directory not found at %s", _PROMPTS_DIR)
        return

    for path in _PROMPTS_DIR.glob("*.md"):
        key = path.stem
        _cache[key] = path.read_text(encoding="utf-8")
        logger.debug("Loaded prompt: %s", key)

    logger.info("Loaded %d prompts from %s", len(_cache), _PROMPTS_DIR)


def get_prompt(name: str) -> str:
    if not _cache:
        _load_all()
    if name not in _cache:
        logger.warning("Prompt '%s' not found, using empty string", name)
        return f"You are an AI interviewer. Prompt '{name}' not found."
    return _cache[name]


def reload_prompts() -> None:
    _cache.clear()
    _load_all()
