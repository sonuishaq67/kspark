"""
Context Loader — parses and normalises the upstream research context file.

The upstream microservice produces a structured text/markdown document containing:
  - resume summary
  - JD summary
  - company summary
  - role expectations
  - common interview questions
  - likely technical topics
  - Reddit/interview thread insights
  - behavioral themes
  - coding patterns

This module extracts a structured CandidateContext from that raw text.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class CandidateContext:
    # Raw inputs
    raw_context_file: str = ""
    resume: str = ""
    job_description: str = ""
    company: str = ""
    role_type: str = ""

    # Extracted / normalised
    candidate_name: str = "Candidate"
    candidate_summary: str = ""
    target_role: str = ""
    company_summary: str = ""
    role_expectations: list[str] = field(default_factory=list)
    likely_topics: list[str] = field(default_factory=list)
    resume_highlights: list[str] = field(default_factory=list)
    risk_areas: list[str] = field(default_factory=list)
    suggested_questions: list[str] = field(default_factory=list)
    behavioral_themes: list[str] = field(default_factory=list)
    coding_patterns: list[str] = field(default_factory=list)
    reddit_insights: str = ""

    def to_prompt_block(self) -> str:
        """Render context as a compact block for LLM prompts."""
        lines = []

        if self.company:
            lines.append(f"**Company:** {self.company}")
        if self.role_type:
            lines.append(f"**Role:** {self.role_type}")
        if self.candidate_summary:
            lines.append(f"\n**Candidate Summary:**\n{self.candidate_summary}")
        if self.role_expectations:
            lines.append("\n**Role Expectations:**")
            lines.extend(f"- {e}" for e in self.role_expectations)
        if self.likely_topics:
            lines.append("\n**Likely Interview Topics:**")
            lines.extend(f"- {t}" for t in self.likely_topics)
        if self.resume_highlights:
            lines.append("\n**Resume Highlights:**")
            lines.extend(f"- {h}" for h in self.resume_highlights)
        if self.risk_areas:
            lines.append("\n**Risk Areas to Probe:**")
            lines.extend(f"- {r}" for r in self.risk_areas)
        if self.behavioral_themes:
            lines.append("\n**Behavioral Themes:**")
            lines.extend(f"- {b}" for b in self.behavioral_themes)
        if self.coding_patterns:
            lines.append("\n**Coding Patterns:**")
            lines.extend(f"- {c}" for c in self.coding_patterns)
        if self.reddit_insights:
            lines.append(f"\n**Interview Insights:**\n{self.reddit_insights}")

        return "\n".join(lines)


def load_context(
    context_file_text: str = "",
    resume: str = "",
    job_description: str = "",
    company: str = "",
    role_type: str = "",
) -> CandidateContext:
    """
    Parse and normalise the context file + raw inputs into a CandidateContext.

    Strategy:
    1. If context_file_text is a structured markdown doc, extract sections by heading.
    2. Fall back to using raw resume + JD directly.
    3. Always populate company/role_type from explicit fields.
    """
    ctx = CandidateContext(
        raw_context_file=context_file_text,
        resume=resume,
        job_description=job_description,
        company=company,
        role_type=role_type,
        target_role=role_type,
    )

    if context_file_text:
        _parse_context_file(ctx, context_file_text)
    else:
        # No structured context file — derive what we can from raw inputs
        _derive_from_raw(ctx)

    logger.info(
        "Context loaded: company=%s role=%s topics=%d risk_areas=%d",
        ctx.company, ctx.role_type, len(ctx.likely_topics), len(ctx.risk_areas),
    )
    return ctx


def _parse_context_file(ctx: CandidateContext, text: str) -> None:
    """
    Extract sections from a markdown-style context file.
    Looks for headings like ## Resume Summary, ## Role Expectations, etc.
    Falls back gracefully if sections are missing.
    """
    sections = _split_by_headings(text)

    # Map common heading variants to our fields
    heading_map = {
        "resume summary": "candidate_summary",
        "candidate summary": "candidate_summary",
        "company summary": "company_summary",
        "company": "company_summary",
        "role expectations": "role_expectations",
        "expectations": "role_expectations",
        "likely topics": "likely_topics",
        "technical topics": "likely_topics",
        "interview topics": "likely_topics",
        "resume highlights": "resume_highlights",
        "highlights": "resume_highlights",
        "risk areas": "risk_areas",
        "gaps": "risk_areas",
        "suggested questions": "suggested_questions",
        "questions": "suggested_questions",
        "behavioral themes": "behavioral_themes",
        "behavioral": "behavioral_themes",
        "coding patterns": "coding_patterns",
        "coding": "coding_patterns",
        "reddit insights": "reddit_insights",
        "interview insights": "reddit_insights",
        "insights": "reddit_insights",
    }

    for heading, content in sections.items():
        key = heading_map.get(heading.lower().strip())
        if not key:
            continue

        if key in ("candidate_summary", "company_summary", "reddit_insights"):
            setattr(ctx, key, content.strip())
        else:
            # Parse as bullet list
            items = _extract_bullets(content)
            if items:
                setattr(ctx, key, items)

    # If company/role not set from explicit fields, try to extract from context
    if not ctx.company and ctx.company_summary:
        # Take first line of company summary as company name hint
        first_line = ctx.company_summary.split("\n")[0].strip()
        if len(first_line) < 60:
            ctx.company = first_line


def _derive_from_raw(ctx: CandidateContext) -> None:
    """Minimal extraction when no structured context file is provided."""
    if ctx.resume:
        # Use first 500 chars of resume as candidate summary
        ctx.candidate_summary = ctx.resume[:500].strip()

    if ctx.job_description:
        # Extract bullet points from JD as role expectations
        ctx.role_expectations = _extract_bullets(ctx.job_description)[:8]


def _split_by_headings(text: str) -> dict[str, str]:
    """Split markdown text into {heading: content} dict."""
    pattern = re.compile(r"^#{1,3}\s+(.+)$", re.MULTILINE)
    matches = list(pattern.finditer(text))

    if not matches:
        return {"full_text": text}

    sections: dict[str, str] = {}
    for i, match in enumerate(matches):
        heading = match.group(1).strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        sections[heading] = text[start:end].strip()

    return sections


def _extract_bullets(text: str) -> list[str]:
    """Extract bullet list items from text."""
    items = []
    for line in text.splitlines():
        line = line.strip()
        # Match -, *, •, or numbered lists
        m = re.match(r"^[-*•]\s+(.+)$", line) or re.match(r"^\d+\.\s+(.+)$", line)
        if m:
            items.append(m.group(1).strip())
        elif line and not line.startswith("#") and len(line) > 10:
            # Plain paragraph lines — include if short enough to be a point
            if len(line) < 200:
                items.append(line)
    return items
