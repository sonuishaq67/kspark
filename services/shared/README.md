# Shared — Common Python Code

This directory contains shared Python code used across all services.

## Ownership

**Owner:** Person 1 (P1)
**Rule:** P1 writes base models and DB helpers in week 1. After that, changes require PR review from all 3 team members.

## Structure

```
shared/
├── models/          # Pydantic models (User, Session, Turn, CandidateModel, etc.)
├── db/              # Database connection pool, migration runner
├── events/          # Internal event bus (publish/subscribe)
└── config_loader/   # YAML config loader + schema validator
```

## Usage

All services import from here:

```python
from services.shared.models import User, Session, Turn
from services.shared.db import get_db_pool
from services.shared.events import publish_event, subscribe_event
from services.shared.config_loader import load_persona_config
```

## Week 1 Deliverables (P1)

1. **models/** — Base Pydantic models for all entities
2. **db/** — Postgres connection pool with async support
3. **events/** — Simple pub/sub event bus (Redis-backed)
4. **config_loader/** — YAML loader with schema validation

After week 1, this becomes **read-only** unless all 3 approve changes.
