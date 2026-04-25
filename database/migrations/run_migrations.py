"""Sequential SQL migration runner.

Reads `*.sql` files in the same directory as this script in lexical order and
applies them inside a single transaction each. Tracks applied versions in a
`_migrations` table. Idempotent: re-running is safe.

Invoked by the Makefile (`make migrate`). Connects via DATABASE_URL or the
`POSTGRES_*` env vars provided by `docker-compose.yml`.
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

import psycopg2
from psycopg2 import sql

MIGRATIONS_DIR = Path(__file__).resolve().parent
FILENAME_RE = re.compile(r"^(\d+)_[\w]+\.sql$")


def _conn_kwargs() -> dict[str, str]:
    url = os.getenv("DATABASE_URL")
    if url:
        return {"dsn": url}
    return {
        "host": os.getenv("POSTGRES_HOST", "localhost"),
        "port": os.getenv("POSTGRES_PORT", "5432"),
        "user": os.getenv("POSTGRES_USER", "postgres"),
        "password": os.getenv("POSTGRES_PASSWORD", "postgres"),
        "dbname": os.getenv("POSTGRES_DB", "interview_coach"),
    }


def _ensure_table(cur) -> None:
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS _migrations (
            version    INT PRIMARY KEY,
            filename   TEXT NOT NULL,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )


def _applied_versions(cur) -> set[int]:
    cur.execute("SELECT version FROM _migrations")
    return {row[0] for row in cur.fetchall()}


def _discover() -> list[tuple[int, Path]]:
    found: list[tuple[int, Path]] = []
    for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
        m = FILENAME_RE.match(path.name)
        if not m:
            print(f"  skip (unrecognized name): {path.name}")
            continue
        found.append((int(m.group(1)), path))
    return found


def main() -> int:
    migrations = _discover()
    if not migrations:
        print("No migrations found.")
        return 0

    conn = psycopg2.connect(**_conn_kwargs())
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            _ensure_table(cur)
            conn.commit()
            applied = _applied_versions(cur)

        for version, path in migrations:
            if version in applied:
                print(f"  skip (applied): {path.name}")
                continue
            print(f"  apply: {path.name}")
            sql_text = path.read_text()
            with conn.cursor() as cur:
                cur.execute(sql_text)
                cur.execute(
                    sql.SQL("INSERT INTO _migrations (version, filename) VALUES (%s, %s)"),
                    (version, path.name),
                )
            conn.commit()
        print("Migrations complete.")
        return 0
    except Exception as exc:  # noqa: BLE001 — surface any DB error to operator
        conn.rollback()
        print(f"Migration failed: {exc}", file=sys.stderr)
        return 1
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
