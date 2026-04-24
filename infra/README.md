# Infra — Infrastructure & Deployment

**Owner:** Person 1

This directory contains all infrastructure configuration and database migrations.

## Structure

```
infra/
├── docker-compose.yml       # Local dev: Postgres, Redis, Judge0
├── migrations/              # Numbered SQL migrations (P1 owns ALL)
│   ├── 001_users.sql
│   ├── 002_candidate_model.sql
│   ├── 003_sessions.sql
│   ├── 004_progression_events.sql
│   ├── 005_company_profiles.sql
│   ├── 006_question_bank.sql
│   └── requests/            # P2/P3 file migration requests here
├── terraform/               # Production AWS provisioning
└── seed/
    ├── question_bank/       # P2 owns (behavioral, system design questions)
    └── leetcode/            # P3 owns (SQLite import script)
```

## Migration Rules

**CRITICAL:** Only P1 touches `.sql` files directly.

### For P2 and P3:
If you need a migration, create a request file:

```bash
# Example: P3 needs a new table
touch infra/migrations/requests/p3_coding_attempts_table.md
```

In the request file:
```markdown
# Migration Request: Coding Attempts Table

**Requested by:** P3
**Date:** 2024-01-15

## Tables Needed

CREATE TABLE coding_attempts (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id),
  user_id UUID REFERENCES users(id),
  question_id TEXT,
  code TEXT,
  language TEXT,
  test_results JSONB,
  submitted_at TIMESTAMPTZ
);

## Indexes

CREATE INDEX idx_coding_attempts_user ON coding_attempts(user_id);
CREATE INDEX idx_coding_attempts_session ON coding_attempts(session_id);
```

P1 will merge it into the numbered sequence.

## Docker Compose

Local development stack:
```bash
docker-compose up -d
```

Services:
- Postgres 16 + pgvector (port 5432)
- Redis 7 (port 6379)
- Judge0 (port 2358)

## Terraform

Production AWS provisioning:
- RDS Postgres
- ElastiCache Redis
- ECS Fargate for services
- S3 for audio/reports
- CloudFront CDN

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Seed Data

### question_bank/ (P2)
200+ interview questions with gap hints:
```bash
python seed/question_bank/import.py
```

### leetcode/ (P3)
LeetCode dataset from Hugging Face:
```bash
make setup  # Downloads and imports to data/leetcode.sqlite
```
