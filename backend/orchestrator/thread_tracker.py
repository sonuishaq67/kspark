"""
Thread tracker — tracks gap coverage and probe count per question.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ThreadState:
    question_id: str
    gap_hints: list[str]
    gaps_closed: set[str] = field(default_factory=set)
    probe_count: int = 0
    status: str = "open"   # "open" | "closed"


def create_thread(question_id: str, gap_hints: list[str]) -> ThreadState:
    return ThreadState(question_id=question_id, gap_hints=list(gap_hints))


def mark_gap_closed(thread: ThreadState, gap: str) -> None:
    """Mark a specific gap hint as addressed."""
    # Fuzzy match: accept if the gap string is a substring of any hint or vice versa
    matched = next(
        (h for h in thread.gap_hints if gap.lower() in h.lower() or h.lower() in gap.lower()),
        gap,
    )
    thread.gaps_closed.add(matched)
    if is_complete(thread):
        thread.status = "closed"


def increment_probe(thread: ThreadState) -> None:
    thread.probe_count += 1
    # Auto-close after 3 probes to avoid infinite loops
    if thread.probe_count >= 3:
        thread.status = "closed"


def is_complete(thread: ThreadState) -> bool:
    """True if all gaps are closed OR probe count has hit the limit."""
    all_gaps_closed = all(
        any(closed.lower() in hint.lower() or hint.lower() in closed.lower()
            for closed in thread.gaps_closed)
        for hint in thread.gap_hints
    )
    return all_gaps_closed or thread.probe_count >= 3


def get_open_gaps(thread: ThreadState) -> list[str]:
    """Return gap hints not yet addressed."""
    open_gaps = []
    for hint in thread.gap_hints:
        addressed = any(
            closed.lower() in hint.lower() or hint.lower() in closed.lower()
            for closed in thread.gaps_closed
        )
        if not addressed:
            open_gaps.append(hint)
    return open_gaps
