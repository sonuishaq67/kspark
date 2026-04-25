from __future__ import annotations

from fastapi.testclient import TestClient

from api.resume import router


def _client() -> TestClient:
    from fastapi import FastAPI

    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def test_parse_resume_pdf_returns_extracted_text(monkeypatch):
    monkeypatch.setattr(
        "api.resume._extract_pdf_text",
        lambda contents: ("Jane Doe\nBackend engineer with Python and distributed systems experience.", 2),
    )

    with _client() as client:
        response = client.post(
            "/api/resume/parse-pdf",
            files={"file": ("resume.pdf", b"%PDF-1.4 fake", "application/pdf")},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["filename"] == "resume.pdf"
    assert body["pages"] == 2
    assert "Backend engineer" in body["text"]


def test_parse_resume_pdf_rejects_non_pdf():
    with _client() as client:
        response = client.post(
            "/api/resume/parse-pdf",
            files={"file": ("resume.txt", b"plain text", "text/plain")},
        )

    assert response.status_code == 400
    assert response.json()["detail"] == "Upload a PDF resume"
