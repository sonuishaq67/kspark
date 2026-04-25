"""
Research API — runs Tavily research and produces a structured context file
that the AI Core's context_loader can ingest.

Flow:
  Frontend → POST /api/research/prepare {resume, job_description, company, role}
           → backend runs Tavily search_company_question_types + interviewer_types
           → returns { context_file: "<markdown>", company, role }
  Frontend → POST /sessions/start {context_file, ...} on AI Core
"""
from __future__ import annotations

import logging
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from llm.tavilyresearch import research_company

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/research", tags=["research"])


class PrepareRequest(BaseModel):
    resume: str = Field(default="", max_length=20000)
    job_description: str = Field(default="", max_length=20000)
    company: str = Field(default="")
    role_type: str = Field(default="software engineer")


class PrepareResponse(BaseModel):
    context_file: str
    company: str
    role: str
    sources_count: int


def _extract_resume_summary(resume: str) -> str:
    """Take the first ~600 chars of the resume as a summary."""
    text = resume.strip()
    if not text:
        return ""
    return text[:600].rstrip() + ("..." if len(text) > 600 else "")


def _extract_jd_bullets(jd: str, limit: int = 8) -> list[str]:
    """Pull bullet/numbered items from the JD; fall back to first sentences."""
    bullets = []
    for line in jd.splitlines():
        line = line.strip()
        m = re.match(r"^[-*•]\s+(.+)$", line) or re.match(r"^\d+\.\s+(.+)$", line)
        if m:
            bullets.append(m.group(1).strip())
        if len(bullets) >= limit:
            break

    if bullets:
        return bullets

    # No bullets — split sentences
    sentences = re.split(r"(?<=[.!?])\s+", jd.strip())
    return [s.strip() for s in sentences if 20 < len(s) < 200][:limit]


def _extract_resume_highlights(resume: str, limit: int = 6) -> list[str]:
    """Pull bullet items from resume."""
    highlights = []
    for line in resume.splitlines():
        line = line.strip()
        m = re.match(r"^[-*•]\s+(.+)$", line)
        if m and 15 < len(m.group(1)) < 220:
            highlights.append(m.group(1).strip())
        if len(highlights) >= limit:
            break
    return highlights


def _summarise_tavily_results(results: list[dict], max_items: int = 5, max_chars: int = 240) -> list[str]:
    """Compact a list of Tavily results into short, readable bullets."""
    out = []
    for item in results[:max_items]:
        title = (item.get("title") or "").strip()
        content = (item.get("content") or "").strip().replace("\n", " ")
        if len(content) > max_chars:
            content = content[: max_chars - 1].rstrip() + "…"
        if title and content:
            out.append(f"{title} — {content}")
        elif content:
            out.append(content)
    return out


def _build_context_markdown(
    *,
    company: str,
    role: str,
    resume: str,
    job_description: str,
    question_types: list[dict],
    interviewer_types: list[dict],
) -> str:
    """Format research + raw inputs into a markdown blob the AI Core can parse."""
    lines: list[str] = []

    lines.append(f"# Interview Context — {company or 'Unknown Company'} / {role}\n")

    resume_summary = _extract_resume_summary(resume)
    if resume_summary:
        lines.append("## Candidate Summary")
        lines.append(resume_summary)
        lines.append("")

    resume_highlights = _extract_resume_highlights(resume)
    if resume_highlights:
        lines.append("## Resume Highlights")
        for h in resume_highlights:
            lines.append(f"- {h}")
        lines.append("")

    if company:
        lines.append("## Company Summary")
        lines.append(f"{company} is the target company for this {role} interview.")
        if interviewer_types:
            top = interviewer_types[0]
            content = (top.get("content") or "").strip().replace("\n", " ")
            if content:
                lines.append(content[:400])
        lines.append("")

    jd_bullets = _extract_jd_bullets(job_description)
    if jd_bullets:
        lines.append("## Role Expectations")
        for b in jd_bullets:
            lines.append(f"- {b}")
        lines.append("")

    qt_bullets = _summarise_tavily_results(question_types)
    if qt_bullets:
        lines.append("## Likely Topics")
        for b in qt_bullets:
            lines.append(f"- {b}")
        lines.append("")

    it_bullets = _summarise_tavily_results(interviewer_types)
    if it_bullets:
        lines.append("## Interview Insights")
        lines.append("Process and panel notes drawn from public sources:")
        for b in it_bullets:
            lines.append(f"- {b}")
        lines.append("")

    # Behavioral themes — generic anchors plus role-specific hints
    lines.append("## Behavioral Themes")
    for theme in [
        "ownership and impact on past projects",
        "handling ambiguity and shifting requirements",
        "conflict resolution and cross-team collaboration",
        "learning curve and growth on a hard problem",
    ]:
        lines.append(f"- {theme}")
    lines.append("")

    # Risk areas — derived from JD vs resume mismatch (very rough heuristic)
    risks = _derive_risk_areas(resume, job_description)
    if risks:
        lines.append("## Risk Areas")
        for r in risks:
            lines.append(f"- {r}")
        lines.append("")

    return "\n".join(lines)


def _derive_risk_areas(resume: str, jd: str) -> list[str]:
    """Very rough: pull keywords from JD that don't appear in the resume."""
    if not resume or not jd:
        return []
    resume_lower = resume.lower()
    candidates = re.findall(
        r"\b(?:kubernetes|docker|aws|gcp|azure|terraform|kafka|spark|redis|"
        r"postgres|mysql|mongo|graphql|grpc|rest|microservices|distributed systems|"
        r"machine learning|ml|llm|rag|tensorflow|pytorch|react|next\.js|typescript|"
        r"go|golang|rust|java|python|scala|c\+\+|system design|on-call|"
        r"observability|prometheus|grafana|ci/cd)\b",
        jd.lower(),
    )
    seen = set()
    risks = []
    for c in candidates:
        if c in seen:
            continue
        seen.add(c)
        if c not in resume_lower:
            risks.append(f"JD mentions {c} — probe candidate's depth here")
        if len(risks) >= 6:
            break
    return risks


@router.post("/prepare", response_model=PrepareResponse)
async def prepare_research(body: PrepareRequest):
    """
    Run Tavily research for the given company/role and bundle resume + JD into
    a single markdown context_file string ready for AI Core ingestion.
    """
    company = (body.company or "").strip()
    role = (body.role_type or "software engineer").strip() or "software engineer"

    question_types: list[dict] = []
    interviewer_types: list[dict] = []

    if company:
        try:
            result = await research_company(company, role)
            question_types = result.question_types
            interviewer_types = result.interviewer_types
            logger.info(
                "Research: company=%s role=%s qt=%d it=%d",
                company, role, len(question_types), len(interviewer_types),
            )
        except Exception as exc:
            logger.warning("Tavily research failed for %s/%s: %s", company, role, exc)
            # Fall through with empty research — context_file will still include
            # resume/JD-derived sections.
    else:
        logger.info("No company provided; skipping Tavily research")

    context_file = _build_context_markdown(
        company=company,
        role=role,
        resume=body.resume,
        job_description=body.job_description,
        question_types=question_types,
        interviewer_types=interviewer_types,
    )

    if not context_file.strip():
        raise HTTPException(422, "Could not build context — provide resume, JD, or company")

    return PrepareResponse(
        context_file=context_file,
        company=company,
        role=role,
        sources_count=len(question_types) + len(interviewer_types),
    )
