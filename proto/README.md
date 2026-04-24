# Proto — API Contracts

This directory contains OpenAPI specifications that define the contracts between services.

## Ownership

Each person authors their own service's OpenAPI spec:
- `auth.yaml` — P1
- `orchestrator.yaml` — P2
- `coding.yaml` — P3
- `progression.yaml` — P3
- `research.yaml` — P1
- `learning.yaml` — P3
- `practice.yaml` — P3

## Rules

1. **Finalize on Day 1** — All contracts must be agreed upon in the kickoff meeting
2. **Read-only after Day 1** — Changes require approval from all 3 team members
3. **Auto-generate clients** — Use `openapi-typescript` to generate `web/lib/api/` (never hand-edit)

## Structure

```yaml
# Example: auth.yaml
openapi: 3.0.0
info:
  title: Auth Service
  version: 1.0.0
paths:
  /auth/register:
    post:
      summary: Register new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                password:
                  type: string
      responses:
        '201':
          description: User created
```

## Usage

Generate TypeScript clients:
```bash
npm run generate:api
```

This reads all `.yaml` files here and outputs typed clients to `web/lib/api/`.
