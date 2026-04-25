from __future__ import annotations

from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel


router = APIRouter(prefix="/api/resume", tags=["resume"])

MAX_PDF_BYTES = 5 * 1024 * 1024
MIN_EXTRACTED_CHARS = 40


class ResumeParseResponse(BaseModel):
    filename: str
    text: str
    pages: int


def _extract_pdf_text(contents: bytes) -> tuple[str, int]:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="PDF parsing is not installed on the backend",
        ) from exc

    try:
        reader = PdfReader(BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Could not read PDF file") from exc

    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception as exc:
            raise HTTPException(status_code=422, detail="Encrypted PDFs are not supported") from exc
        if reader.is_encrypted:
            raise HTTPException(status_code=422, detail="Encrypted PDFs are not supported")

    page_text = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        normalized = " ".join(text.split())
        if normalized:
            page_text.append(normalized)

    return "\n\n".join(page_text).strip(), len(reader.pages)


@router.post("/parse-pdf", response_model=ResumeParseResponse)
async def parse_resume_pdf(file: UploadFile = File(...)) -> ResumeParseResponse:
    filename = file.filename or "resume.pdf"
    is_pdf_name = filename.lower().endswith(".pdf")
    is_pdf_type = file.content_type in {"application/pdf", "application/x-pdf"}
    if not (is_pdf_name or is_pdf_type):
        raise HTTPException(status_code=400, detail="Upload a PDF resume")

    contents = await file.read(MAX_PDF_BYTES + 1)
    if len(contents) > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="PDF resume must be 5 MB or smaller")
    if not contents:
        raise HTTPException(status_code=400, detail="PDF resume is empty")

    text, pages = _extract_pdf_text(contents)
    if len(text) < MIN_EXTRACTED_CHARS:
        raise HTTPException(
            status_code=422,
            detail="Could not extract enough text from this PDF. Try a text-based resume PDF.",
        )

    return ResumeParseResponse(filename=filename, text=text[:8000], pages=pages)
