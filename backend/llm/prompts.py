"""
Prompt template loader.
Reads .md files from the prompts/ directory at startup.
"""
from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Resolve prompts/ relative to the repo root (two levels up from backend/llm/)
_PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"

_cache: dict[str, str] = {}


def _load_all() -> None:
    """Load all .md files from prompts/ into the cache."""
    if not _PROMPTS_DIR.exists():
        logger.warning("prompts/ directory not found at %s", _PROMPTS_DIR)
        return

    for path in _PROMPTS_DIR.glob("*.md"):
        key = path.stem   # e.g. "classify_turn" from "classify_turn.md"
        _cache[key] = path.read_text(encoding="utf-8")
        logger.debug("Loaded prompt: %s", key)

    logger.info("Loaded %d prompt templates from %s", len(_cache), _PROMPTS_DIR)


def get_prompt(name: str) -> str:
    """
    Return the prompt template string for the given name.
    Raises KeyError if the prompt file doesn't exist.
    """
    if not _cache:
        _load_all()

    if name not in _cache:
        raise KeyError(f"Prompt '{name}' not found. Available: {list(_cache.keys())}")

    return _cache[name]


def reload_prompts() -> None:
    """Force reload all prompts from disk (useful during development)."""
    _cache.clear()
    _load_all()
