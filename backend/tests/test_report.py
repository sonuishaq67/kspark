from __future__ import annotations

import asyncio

import pytest
from fastapi.testclient import TestClient

from db import queries
from db.init import get_db
from main import app


def _run(coro):
    return asyncio.run(coro)


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("SQLITE_PATH", str(tmp_path / "report-test.db"))
    monkeypatch.setenv("MOCK_LLM", "1")
    monkeypatch.delenv("GROQ_API_KEY", raising=False)

    with TestClient(app) as test_client:
        yield test_client


def _create_session() -> str:
    session = _run(queries.create_session())
    return session["session_id"]


def _append_candidate_turn(session_id: str, transcript: str = "I built the API and improved latency."):
    _run(
        queries.append_turn(
            session_id=session_id,
            question_id="q1",
            speaker="candidate",
            transcript=transcript,
            classification="partial",
            gap_addressed="Metrics / measurable impact",
            probe_count=1,
        )
    )


def _append_agent_turn(session_id: str, transcript: str = "How would it handle 10x traffic?"):
    _run(
        queries.append_turn(
            session_id=session_id,
            question_id="q1",
            speaker="agent",
            transcript=transcript,
        )
    )


def _mark_role_ready_session(session_id: str):
    async def _update():
        db = await get_db()
        try:
            await db.execute(
                """
                UPDATE sessions
                SET target_role = ?, readiness_score = ?, summary = ?, company_name = ?
                WHERE id = ?
                """,
                (
                    "Backend Engineer Intern",
                    58,
                    "Strong API basics, weaker scaling depth.",
                    "Acme Corp",
                    session_id,
                ),
            )
            await db.commit()
        finally:
            await db.close()

    _run(_update())


def _insert_open_gap(session_id: str, label: str = "Database scaling"):
    async def _insert():
        db = await get_db()
        try:
            await db.execute(
                """
                INSERT INTO gaps (id, session_id, label, category, evidence, status, created_at)
                VALUES (?, ?, ?, 'missing', ?, 'open', datetime('now'))
                """,
                (f"gap-{session_id}", session_id, label, "No scaling discussion yet."),
            )
            await db.commit()
        finally:
            await db.close()

    _run(_insert())


def test_finish_session_generates_report_and_is_idempotent(client: TestClient):
    session_id = _create_session()
    _append_agent_turn(session_id)
    _append_candidate_turn(session_id)

    first = client.post(f"/api/sessions/{session_id}/finish")
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["session_id"] == session_id
    assert first_body["report_id"]
    assert first_body["scores"]["role_alignment"] == 7

    second = client.post(f"/api/sessions/{session_id}/finish")
    assert second.status_code == 200
    second_body = second.json()
    assert second_body["report_id"] == first_body["report_id"]
    assert second_body["summary"] == first_body["summary"]

    session_row = _run(queries.get_session(session_id))
    assert session_row["state"] == "ENDED"
    assert session_row["ended_at"] is not None


def test_get_report_returns_stored_report_with_metadata(client: TestClient):
    session_id = _create_session()
    _mark_role_ready_session(session_id)
    _append_agent_turn(session_id)
    _append_candidate_turn(session_id)

    finish_response = client.post(f"/api/sessions/{session_id}/finish")
    assert finish_response.status_code == 200

    report_response = client.get(f"/api/sessions/{session_id}/report")
    assert report_response.status_code == 200
    body = report_response.json()
    assert body["report_id"] == finish_response.json()["report_id"]
    assert body["target_role"] == "Backend Engineer Intern"
    assert body["readiness_score"] == 58
    assert body["created_at"]
    assert body["started_at"]


def test_finish_session_requires_candidate_turns(client: TestClient):
    session_id = _create_session()

    response = client.post(f"/api/sessions/{session_id}/finish")
    assert response.status_code == 422
    assert response.json()["detail"] == "No turns to analyze"


def test_get_report_returns_404_for_role_ready_session_without_report(client: TestClient):
    session_id = _create_session()
    _mark_role_ready_session(session_id)

    response = client.get(f"/api/sessions/{session_id}/report")
    assert response.status_code == 404
    assert response.json()["detail"] == "Report not generated yet"


def test_list_sessions_includes_target_role_readiness_and_main_gap(client: TestClient):
    session_id = _create_session()
    _mark_role_ready_session(session_id)
    _insert_open_gap(session_id)

    response = client.get("/api/sessions")
    assert response.status_code == 200
    sessions = response.json()
    matching = next(item for item in sessions if item["session_id"] == session_id)
    assert matching["target_role"] == "Backend Engineer Intern"
    assert matching["readiness_score"] == 58
    assert matching["main_gap"] == "Database scaling"
