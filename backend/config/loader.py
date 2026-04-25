"""
YAML config loader for personas (and future configs).
Validates required fields at startup and raises on missing.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import yaml

logger = logging.getLogger(__name__)

_CONFIG_DIR = Path(__file__).parent.parent.parent / "config"

REQUIRED_PERSONA_FIELDS = {"id", "display_name", "silence_threshold_seconds", "prompt_fragment"}


@dataclass
class PersonaConfig:
    id: str
    display_name: str
    silence_threshold_seconds: int
    prompt_fragment: str


_personas: dict[str, PersonaConfig] = {}


def _load_personas() -> None:
    personas_dir = _CONFIG_DIR / "personas"
    if not personas_dir.exists():
        logger.warning("config/personas/ not found at %s", personas_dir)
        return

    for path in personas_dir.glob("*.yaml"):
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        missing = REQUIRED_PERSONA_FIELDS - set(data.keys())
        if missing:
            raise ValueError(f"Persona config {path.name} missing fields: {missing}")

        persona = PersonaConfig(
            id=data["id"],
            display_name=data["display_name"],
            silence_threshold_seconds=int(data["silence_threshold_seconds"]),
            prompt_fragment=data["prompt_fragment"].strip(),
        )
        _personas[persona.id] = persona
        logger.debug("Loaded persona: %s", persona.id)

    logger.info("Loaded %d personas", len(_personas))


def load_all_configs() -> None:
    """Call at app startup to validate all configs."""
    _load_personas()


def get_persona(persona_id: str) -> PersonaConfig:
    if not _personas:
        _load_personas()
    if persona_id not in _personas:
        raise KeyError(f"Persona '{persona_id}' not found. Available: {list(_personas.keys())}")
    return _personas[persona_id]


def list_personas() -> list[PersonaConfig]:
    if not _personas:
        _load_personas()
    return list(_personas.values())
