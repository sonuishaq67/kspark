"""
REST API routes for readiness analysis (gap analysis).
Ishaq's module: JD/Resume Gap Engine.
"""
from __future__ import annotations

import json
import logging
import uuid
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from db import queries
from llm.client import REASONING_MODEL, chat
from llm.mock_responses import get_mock_response, is_mock_mode
from llm.prompts import get_prompt

router = APIRouter(prefix="/api/readiness", tags=["readiness"])
logger = logging.getLogger(__name__)

DEMO_USER_ID = "demo-user-001"


# ── request / response models ─────────────────────────────────────────────────

class SkillItem(BaseModel):
    """A single skill or requirement with evidence."""
    label: str = Field(..., description="Skill or requirement name")
    evidence: str | None = Field(None, description="Evidence from resume or JD")


class ReadinessAnalysisRequest(BaseModel):
    """Input for gap analysis."""
    job_description: str = Field(..., max_length=8000, description="Job description text")
    resume: str = Field(..., max_length=6000, description="Resume or experience summary")
    company: str | None = Field(None, max_length=200, description="Company name")
    role_type: str | None = Field(None, max_length=200, description="Role type (e.g., SDE2, Senior Engineer)")
    interview_type: Literal["behavioral", "technical", "coding", "mixed"] = "mixed"


class ReadinessAnalysisResponse(BaseModel):
    """Output from gap analysis."""
    session_id: str
    readiness_score: int = Field(..., ge=0, le=100, description="Overall readiness score (0-100)")
    summary: str = Field(..., description="Brief summary of candidate readiness")
    strong_matches: list[SkillItem] = Field(default_factory=list, description="Skills with strong evidence")
    partial_matches: list[SkillItem] = Field(default_factory=list, description="Skills with partial evidence")
    missing_or_weak: list[SkillItem] = Field(default_factory=list, description="Skills missing or weak evidence")
    interview_focus_areas: list[str] = Field(default_factory=list, description="2-3 key areas to probe in interview")
    prep_brief: list[str] = Field(default_factory=list, description="3-5 actionable prep tips")


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.post("/analyze", response_model=ReadinessAnalysisResponse)
async def analyze_readiness(request: ReadinessAnalysisRequest):
    """
    Analyze candidate readiness by comparing resume to job description.
    
    Returns:
        - Readiness score (0-100)
        - Skills categorized as strong/partial/missing
        - Interview focus areas
        - Prep brief with actionable tips
    """
    if not request.job_description.strip():
        raise HTTPException(400, "job_description is required")
    if not request.resume.strip():
        raise HTTPException(400, "resume is required")

    logger.info(
        "Analyzing readiness: company=%s role=%s jd_len=%d resume_len=%d",
        request.company,
        request.role_type,
        len(request.job_description),
        len(request.resume),
    )

    # Generate analysis from LLM or mock
    if is_mock_mode():
        analysis = get_mock_response("readiness_analysis")
    else:
        analysis = await _generate_analysis_from_llm(request)

    # Create session with gap analysis metadata
    session_id = str(uuid.uuid4())
    await queries.create_session(
        session_id=session_id,
        user_id=DEMO_USER_ID,
        mode="professional",  # Default mode
        persona_id="neutral",  # Default persona
        target_role=request.role_type or "Unknown",
        company_name=request.company,
        interview_type=request.interview_type,
        readiness_score=analysis["readiness_score"],
        summary=analysis["summary"],
    )

    # Insert gaps into database
    for skill in analysis["strong_matches"]:
        await queries.insert_gap(
            session_id=session_id,
            label=skill["label"],
            category="strong",
            evidence=skill.get("evidence"),
        )

    for skill in analysis["partial_matches"]:
        await queries.insert_gap(
            session_id=session_id,
            label=skill["label"],
            category="partial",
            evidence=skill.get("evidence"),
        )

    for skill in analysis["missing_or_weak"]:
        await queries.insert_gap(
            session_id=session_id,
            label=skill["label"],
            category="missing",
            evidence=skill.get("evidence"),
        )

    logger.info(
        "Readiness analysis complete: session_id=%s score=%d gaps=%d",
        session_id,
        analysis["readiness_score"],
        len(analysis["strong_matches"]) + len(analysis["partial_matches"]) + len(analysis["missing_or_weak"]),
    )

    return ReadinessAnalysisResponse(
        session_id=session_id,
        readiness_score=analysis["readiness_score"],
        summary=analysis["summary"],
        strong_matches=[SkillItem(**s) for s in analysis["strong_matches"]],
        partial_matches=[SkillItem(**s) for s in analysis["partial_matches"]],
        missing_or_weak=[SkillItem(**s) for s in analysis["missing_or_weak"]],
        interview_focus_areas=analysis["interview_focus_areas"],
        prep_brief=analysis["prep_brief"],
    )


@router.get("/{session_id}/gaps")
async def get_session_gaps(session_id: str):
    """
    Get all gaps for a session, grouped by category.
    
    Returns:
        - strong: list of strong matches
        - partial: list of partial matches
        - missing: list of missing/weak skills
    """
    gaps = await queries.get_gaps_for_session(session_id)
    if not gaps:
        raise HTTPException(404, "No gaps found for this session")

    result = {
        "session_id": session_id,
        "strong": [],
        "partial": [],
        "missing": [],
    }

    for gap in gaps:
        item = {
            "id": gap["id"],
            "label": gap["label"],
            "evidence": gap.get("evidence"),
            "status": gap["status"],
        }
        category = gap["category"]
        if category in result:
            result[category].append(item)

    return result


# ── helper functions ──────────────────────────────────────────────────────────

async def _generate_analysis_from_llm(request: ReadinessAnalysisRequest) -> dict:
    """Generate gap analysis using Groq LLM."""
    prompt = get_prompt("readiness_analysis")
    
    context = f"""# Job Description
{request.job_description}

# Candidate Resume
{request.resume}

# Additional Context
Company: {request.company or "Not specified"}
Role: {request.role_type or "Not specified"}
Interview Type: {request.interview_type}
"""

    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": context},
    ]

    try:
        raw = await chat(
            messages=messages,
            model=REASONING_MODEL,
            response_format={"type": "json_object"},
            temperature=0.3,  # Low temp for consistent analysis
            max_tokens=2000,
        )
        analysis = json.loads(raw)
        
        # Validate required fields
        required_fields = [
            "readiness_score",
            "summary",
            "strong_matches",
            "partial_matches",
            "missing_or_weak",
            "interview_focus_areas",
            "prep_brief",
        ]
        for field in required_fields:
            if field not in analysis:
                raise ValueError(f"Missing required field: {field}")
        
        return analysis
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse LLM response as JSON: %s", raw)
        raise HTTPException(500, "Gap analysis failed: invalid LLM response") from exc
    except Exception as exc:
        logger.error("Gap analysis failed: %s", exc)
        raise HTTPException(500, f"Gap analysis failed: {str(exc)}") from exc
