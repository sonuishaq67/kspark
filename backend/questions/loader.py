"""
Demo question loader.
Reads database/seed_data/demo_questions.yaml at startup into a module-level list.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import yaml

logger = logging.getLogger(__name__)

_SEED_PATH = Path(__file__).parent.parent.parent / "database" / "seed_data" / "demo_questions.yaml"


@dataclass
class Question:
    id: str
    topic: str
    text: str
    gap_hints: list[str]


_questions: list[Question] = []


def _load() -> None:
    global _questions
    if not _SEED_PATH.exists():
        raise FileNotFoundError(f"Demo questions file not found: {_SEED_PATH}")

    data = yaml.safe_load(_SEED_PATH.read_text(encoding="utf-8"))
    _questions = [
        Question(
            id=q["id"],
            topic=q["topic"],
            text=q["text"],
            gap_hints=q["gap_hints"],
        )
        for q in data["questions"]
    ]
    logger.info("Loaded %d demo questions", len(_questions))


def get_all_questions() -> list[Question]:
    if not _questions:
        _load()
    return list(_questions)


def get_question(question_id: str) -> Optional[Question]:
    if not _questions:
        _load()
    return next((q for q in _questions if q.id == question_id), None)
