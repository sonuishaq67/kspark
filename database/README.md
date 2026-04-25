# Database — Migrations & Seed Data

**Owner:** Person 1 (Ishaq)

This directory contains SQL migrations and seed data for the RoleReady AI MVP.

## Structure

```
database/
├── README.md
├── migrations/              # Numbered SQL migrations
│   ├── 001_demo_minimal.sql
│   ├── 002_roleready_extensions.sql
│   ├── run_migrations.py
│   └── requests/            # P2/P3 file migration requests here
└── seed_data/               # Demo data YAML files
    ├── demo_questions.yaml
    └── demo_session.yaml
```

## Migration Rules

**CRITICAL:** Only Ishaq touches `.sql` files directly.

### For Shivam and Vard:
If you need a migration, create a request file:

```bash
# Example: Shivam needs a new table
touch database/migrations/requests/shivam_new_table.md
```

In the request file:
```markdown
# Migration Request: New Table

**Requested by:** Shivam
**Date:** 2024-04-24

## Tables Needed

CREATE TABLE new_table (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

## Indexes

CREATE INDEX idx_new_table_session ON new_table(session_id);
```

Ishaq will merge it into the numbered sequence.

## Seed Data

### demo_questions.yaml
Demo interview questions loaded at startup:
```yaml
questions:
  - id: "q1"
    topic: "System Design"
    text: "Design a URL shortener"
    gap_hints: ["scalability", "database design"]
```

### demo_session.yaml
Demo gap data for dashboard:
```yaml
sessions:
  - id: "demo-001"
    target_role: "Senior Backend Engineer"
    readiness_score: 75
    gaps:
      - label: "Distributed systems experience"
        category: "missing"
```

## Running Migrations

Migrations run automatically at startup via `backend/db/init.py`.

Manual run:
```bash
cd database/migrations
python run_migrations.py
```
