"""Session state helpers for live code review."""
from __future__ import annotations

import time

from app.models.session import InterviewSession


def record_code_update(
    session: InterviewSession,
    code: str,
    language: str,
) -> None:
    """Store the latest candidate code while keeping bounded history."""
    session.latest_code = code
    session.latest_language = language
    session.code_snapshots.append({
        "timestamp": time.time(),
        "language": language,
        "code": code,
    })
    session.code_snapshots = session.code_snapshots[-20:]


def format_latest_code_block(session: InterviewSession, heading: str) -> str:
    """Return the latest code as a prompt section, or an empty string."""
    if not session.latest_code.strip():
        return ""

    return f"""

## {heading}
Language: {session.latest_language}

```{session.latest_language}
{session.latest_code}
```
"""
