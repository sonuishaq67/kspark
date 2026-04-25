from __future__ import annotations

import asyncio

import pytest
from fastapi.testclient import TestClient

from db import queries
from main import app
from orchestrator.session_manager import process_turn
from orchestrator.state import get_session_state


def _run(coro):
    return asyncio.run(coro)


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("SQLITE_PATH", str(tmp_path / "demo-e2e.db"))
    monkeypatch.setenv("MOCK_LLM", "1")
    monkeypatch.setenv("MOCK_ASR", "1")
    monkeypatch.setenv("MOCK_TTS", "1")
    monkeypatch.delenv("GROQ_API_KEY", raising=False)

    with TestClient(app) as test_client:
        yield test_client


def test_demo_flow_smoke_test(client: TestClient):
    readiness_response = client.post(
        "/api/readiness/analyze",
        json={
            "job_description": (
                "Senior backend engineer role focused on distributed systems, "
                "Kubernetes, and high-traffic API design."
            ),
            "resume": (
                "Python engineer with microservices experience, API optimization work, "
                "and mentorship of junior developers."
            ),
            "company": "Acme",
            "role_type": "Senior Backend Engineer",
            "interview_type": "mixed",
        },
    )
    assert readiness_response.status_code == 200
    readiness_body = readiness_response.json()
    assert readiness_body["readiness_score"] == 65

    gaps_response = client.get(f"/api/readiness/{readiness_body['session_id']}/gaps")
    assert gaps_response.status_code == 200
    gaps_body = gaps_response.json()
    assert gaps_body["strong"]
    assert gaps_body["missing"]

    start_response = client.post(
        "/api/sessions",
        json={"mode": "learning", "persona_id": "friendly"},
    )
    assert start_response.status_code == 200
    start_body = start_response.json()
    session_id = start_body["session_id"]
    assert "First question:" in start_body["intro_message"]
    assert get_session_state(session_id) is not None

    first_turn = _run(
        process_turn(
            session_id,
            "I shipped the migration, but I should explain the timeline and the exact impact better.",
        )
    )
    assert first_turn.action == "probe"
    assert "concrete example" in first_turn.utterance

    second_turn = _run(
        process_turn(
            session_id,
            "We had two weeks, I owned the caching rollout, and latency dropped from 200ms to 120ms.",
        )
    )
    assert second_turn.action == "advance"

    turns = _run(queries.get_turns_for_session(session_id))
    assert len(turns) >= 5
    assert any(turn["speaker"] == "candidate" for turn in turns)

    finish_response = client.post(f"/api/sessions/{session_id}/finish")
    assert finish_response.status_code == 200
    finish_body = finish_response.json()
    assert finish_body["session_id"] == session_id
    assert finish_body["report_id"]
    assert finish_body["scores"]["role_alignment"] == 7

    report_response = client.get(f"/api/sessions/{session_id}/report")
    assert report_response.status_code == 200
    report_body = report_response.json()
    assert report_body["report_id"] == finish_body["report_id"]
    assert report_body["summary"] == finish_body["summary"]
