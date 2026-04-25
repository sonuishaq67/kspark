"""
Tavily Research Module
Researches company-specific interview questions and interviewer types
using the Tavily Search API.
"""

import logging
import os
import json
from dataclasses import dataclass, field
from dotenv import load_dotenv
from tavily import TavilyClient

from db.cache_queries import get_cached_research, upsert_research_cache

logger = logging.getLogger(__name__)

load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

if not TAVILY_API_KEY:
    raise EnvironmentError("TAVILY_API_KEY is not set in the environment.")

client = TavilyClient(api_key=TAVILY_API_KEY)


def _normalize_company(name: str) -> str:
    """Normalize a company name for consistent cache key lookup."""
    return name.strip().lower()


def _get_ttl_hours() -> int:
    """Read cache TTL from env, defaulting to 168 hours (7 days)."""
    raw = os.getenv("TAVILY_CACHE_TTL_HOURS")
    if raw is None:
        return 168  # 7 days
    try:
        val = int(raw)
        if val <= 0:
            raise ValueError("TTL must be positive")
        return val
    except (ValueError, TypeError):
        logger.warning("Invalid TAVILY_CACHE_TTL_HOURS=%r, using default 168h", raw)
        return 168


@dataclass
class CompanyResearchResult:
    """Holds structured research results for a company."""
    company: str
    role: str
    question_types: list[dict] = field(default_factory=list)
    interviewer_types: list[dict] = field(default_factory=list)


async def search_company_question_types(company: str, role: str = "software engineer") -> list[dict]:
    """
    Research the types of interview questions a company typically asks.

    Args:
        company: Company name (e.g. "Google", "Amazon").
        role: Target role (default: "software engineer").

    Returns:
        List of result dicts with 'title', 'url', 'content' keys.
    """
    normalized = _normalize_company(company)
    ttl = _get_ttl_hours()

    # Best-effort cache read
    try:
        cached = await get_cached_research(normalized, role, "question_types", ttl)
        if cached is not None:
            return cached
    except Exception:
        logger.warning("Cache read failed for %s/%s/question_types, falling back to Tavily", company, role, exc_info=True)

    # Live fetch from Tavily
    try:
        query = f"{company} {role} interview question types and categories"
        response = client.search(
            query=query,
            search_depth="advanced",
            max_results=5,
            include_answer=True,
        )

        results = []
        for item in response.get("results", []):
            results.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "content": item.get("content", ""),
                "score": item.get("score", 0),
            })
    except Exception as tavily_err:
        logger.warning("Tavily search failed for %s/%s/question_types: %s", company, role, tavily_err, exc_info=True)
        # If Tavily errors and stale cached data exists, return the stale data
        try:
            stale = await get_cached_research(normalized, role, "question_types", 999999)
            if stale is not None:
                return stale
        except Exception:
            logger.warning("Stale cache fallback also failed for %s/%s/question_types", company, role, exc_info=True)
        raise tavily_err

    # Best-effort cache write on successful non-empty results
    if results:
        try:
            await upsert_research_cache(normalized, role, "question_types", json.dumps(results))
        except Exception:
            logger.warning("Cache write failed for %s/%s/question_types", company, role, exc_info=True)

    return results


async def search_company_interviewer_types(company: str, role: str = "software engineer") -> list[dict]:
    """
    Research the types of interviewers a candidate might encounter at a company.

    Args:
        company: Company name (e.g. "Google", "Amazon").
        role: Target role (default: "software engineer").

    Returns:
        List of result dicts with 'title', 'url', 'content' keys.
    """
    normalized = _normalize_company(company)
    ttl = _get_ttl_hours()

    # Best-effort cache read
    try:
        cached = await get_cached_research(normalized, role, "interviewer_types", ttl)
        if cached is not None:
            return cached
    except Exception:
        logger.warning("Cache read failed for %s/%s/interviewer_types, falling back to Tavily", company, role, exc_info=True)

    # Live fetch from Tavily
    try:
        query = f"{company} {role} interview process interviewer types rounds panel"
        response = client.search(
            query=query,
            search_depth="advanced",
            max_results=5,
            include_answer=True,
        )

        results = []
        for item in response.get("results", []):
            results.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "content": item.get("content", ""),
                "score": item.get("score", 0),
            })
    except Exception as tavily_err:
        logger.warning("Tavily search failed for %s/%s/interviewer_types: %s", company, role, tavily_err, exc_info=True)
        # If Tavily errors and stale cached data exists, return the stale data
        try:
            stale = await get_cached_research(normalized, role, "interviewer_types", 999999)
            if stale is not None:
                return stale
        except Exception:
            logger.warning("Stale cache fallback also failed for %s/%s/interviewer_types", company, role, exc_info=True)
        raise tavily_err

    # Best-effort cache write on successful non-empty results
    if results:
        try:
            await upsert_research_cache(normalized, role, "interviewer_types", json.dumps(results))
        except Exception:
            logger.warning("Cache write failed for %s/%s/interviewer_types", company, role, exc_info=True)

    return results


async def research_company(company: str, role: str = "software engineer") -> CompanyResearchResult:
    """
    Run a full research pass for a company: question types + interviewer types.

    Args:
        company: Company name.
        role: Target role.

    Returns:
        CompanyResearchResult with both research categories populated.
    """
    result = CompanyResearchResult(company=company, role=role)
    result.question_types = await search_company_question_types(company, role)
    result.interviewer_types = await search_company_interviewer_types(company, role)
    return result


def print_research(result: CompanyResearchResult) -> None:
    """Pretty-print research results to the console."""
    print(f"\n{'='*60}")
    print(f"  Company Research: {result.company} — {result.role}")
    print(f"{'='*60}")

    print(f"\n--- Question Types ({len(result.question_types)} sources) ---")
    for i, item in enumerate(result.question_types, 1):
        print(f"\n  [{i}] {item['title']}")
        print(f"      URL:   {item['url']}")
        print(f"      Score: {item['score']:.2f}")
        # Trim content to first 300 chars for readability
        content = item["content"][:300]
        print(f"      {content}...")

    print(f"\n--- Interviewer Types ({len(result.interviewer_types)} sources) ---")
    for i, item in enumerate(result.interviewer_types, 1):
        print(f"\n  [{i}] {item['title']}")
        print(f"      URL:   {item['url']}")
        print(f"      Score: {item['score']:.2f}")
        content = item["content"][:300]
        print(f"      {content}...")

    print(f"\n{'='*60}\n")


# ── CLI entry point ──────────────────────────────────────────
if __name__ == "__main__":
    import argparse
    import asyncio

    parser = argparse.ArgumentParser(
        description="Research company interview questions and interviewer types via Tavily."
    )
    parser.add_argument("company", help="Company name to research (e.g. Google, Amazon)")
    parser.add_argument(
        "--role",
        default="software engineer",
        help="Target role (default: 'software engineer')",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON instead of formatted text",
    )
    args = parser.parse_args()

    research = asyncio.run(research_company(args.company, args.role))

    if args.json:
        output = {
            "company": research.company,
            "role": research.role,
            "question_types": research.question_types,
            "interviewer_types": research.interviewer_types,
        }
        print(json.dumps(output, indent=2))
    else:
        print_research(research)
