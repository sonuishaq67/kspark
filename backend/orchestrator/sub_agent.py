"""
Per-question sub-agent.
Stateless across questions — receives focused context, returns an action + utterance.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass

from llm.client import CLASSIFIER_MODEL, REASONING_MODEL, chat, chat_json
from llm.prompts import get_prompt
from orchestrator.thread_tracker import ThreadState, get_open_gaps
from questions.loader import Question

logger = logging.getLogger(__name__)

# Patterns that indicate a ghostwriting attempt
_GHOSTWRITE_PATTERNS = [
    r"just tell me what to say",
    r"give me (the |a |an )?answer",
    r"what should i say",
    r"write (it|this|me) (for me|out|up)",
    r"tell me (the |a )?answer",
    r"give me (a |the )?sample",
    r"give me (a |the )?template",
    r"can you (just )?answer (this|it|for me)",
]
_GHOSTWRITE_RE = re.compile("|".join(_GHOSTWRITE_PATTERNS), re.IGNORECASE)


@dataclass
class SubAgentResponse:
    action: str          # "probe" | "advance" | "clarify" | "stall" | "refuse"
    utterance: str
    gap_addressed: str | None = None
    classification: str | None = None


def _is_ghostwriting(transcript: str) -> bool:
    return bool(_GHOSTWRITE_RE.search(transcript))


def _build_transcript_context(turn_history: list[dict]) -> str:
    """Format recent turns as a readable conversation snippet."""
    lines = []
    for t in turn_history[-6:]:   # last 6 turns for context
        speaker = "Candidate" if t["speaker"] == "candidate" else "Interviewer"
        lines.append(f"{speaker}: {t['transcript']}")
    return "\n".join(lines)


async def run_turn(
    question: Question,
    thread_state: ThreadState,
    turn_transcript: str,
    mode: str,
    persona_id: str,
    persona_prompt_fragment: str,
    prior_turn_history: list[dict],
) -> SubAgentResponse:
    """
    Process one candidate turn and return the sub-agent's response.
    """

    # 1. Ghostwriting check (fast regex, no LLM call)
    if _is_ghostwriting(turn_transcript):
        refusal = await _generate_refusal(mode, turn_transcript, persona_prompt_fragment)
        return SubAgentResponse(
            action="refuse",
            utterance=refusal,
            gap_addressed=None,
            classification="refusal",
        )

    # 2. Classify the turn
    open_gaps = get_open_gaps(thread_state)
    classification_result = await _classify_turn(
        question=question,
        transcript=turn_transcript,
        open_gaps=open_gaps,
        prior_history=prior_turn_history,
    )

    kind = classification_result.get("kind", "partial")
    gap_addressed = classification_result.get("gap_addressed")

    # 3. Dispatch on classification
    if kind == "complete":
        utterance = await _generate_acknowledgment(
            question=question,
            persona_id=persona_id,
            persona_fragment=persona_prompt_fragment,
            mode=mode,
        )
        return SubAgentResponse(
            action="advance",
            utterance=utterance,
            gap_addressed=gap_addressed,
            classification="complete",
        )

    elif kind == "clarify":
        utterance = await _generate_clarification(
            question=question,
            transcript=turn_transcript,
            persona_fragment=persona_prompt_fragment,
        )
        return SubAgentResponse(
            action="clarify",
            utterance=utterance,
            gap_addressed=None,
            classification="clarify",
        )

    elif kind == "stall":
        utterance = _stall_nudge(persona_id)
        return SubAgentResponse(
            action="stall",
            utterance=utterance,
            gap_addressed=None,
            classification="stall",
        )

    else:  # partial
        # Pick the first open gap to probe
        target_gap = open_gaps[0] if open_gaps else (gap_addressed or "your overall approach")
        probe = await _generate_probe(
            question=question,
            target_gap=target_gap,
            transcript=turn_transcript,
            prior_history=prior_turn_history,
            persona_id=persona_id,
            persona_fragment=persona_prompt_fragment,
        )
        return SubAgentResponse(
            action="probe",
            utterance=probe,
            gap_addressed=gap_addressed,
            classification="partial",
        )


# ── LLM helpers ───────────────────────────────────────────────────────────────

async def _classify_turn(
    question: Question,
    transcript: str,
    open_gaps: list[str],
    prior_history: list[dict],
) -> dict:
    system_prompt = get_prompt("classify_turn")
    context = _build_transcript_context(prior_history)

    user_content = f"""## Question
{question.text}

## Gap hints to look for
{chr(10).join(f'- {g}' for g in question.gap_hints)}

## Open gaps (not yet addressed)
{chr(10).join(f'- {g}' for g in open_gaps) if open_gaps else '(none — all gaps addressed)'}

## Conversation so far
{context}

## Candidate's latest answer
{transcript}"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    try:
        return await chat_json(messages, model=CLASSIFIER_MODEL)
    except ValueError:
        logger.warning("Classification failed, defaulting to partial")
        return {"kind": "partial", "gap_addressed": None}


async def _generate_probe(
    question: Question,
    target_gap: str,
    transcript: str,
    prior_history: list[dict],
    persona_id: str,
    persona_fragment: str,
) -> str:
    system_prompt = get_prompt("generate_probe")
    context = _build_transcript_context(prior_history)

    user_content = f"""## Persona
{persona_fragment}

## Question being asked
{question.text}

## Gap to probe (do NOT reveal this verbatim)
{target_gap}

## Conversation so far
{context}

## Candidate's latest answer
{transcript}

Generate a single follow-up probe targeting the gap above."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    return await chat(messages, model=REASONING_MODEL, temperature=0.7, max_tokens=150)


async def _generate_refusal(mode: str, transcript: str, persona_fragment: str) -> str:
    scaffold_fragment = get_prompt("scaffold_refusal")

    system_prompt = f"""{scaffold_fragment}

## Current mode: {mode}
Generate a refusal response appropriate for {mode} mode."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Candidate said: {transcript}\n\nGenerate the refusal."},
    ]

    return await chat(messages, model=REASONING_MODEL, temperature=0.5, max_tokens=150)


async def _generate_acknowledgment(
    question: Question,
    persona_id: str,
    persona_fragment: str,
    mode: str,
) -> str:
    """Brief acknowledgment before advancing to the next question."""
    system_prompt = f"""You are an AI interviewer. The candidate has fully answered the current question.
Give a brief acknowledgment (1 sentence max) and indicate you're moving on.
Persona: {persona_fragment}
Mode: {mode}
Do NOT give detailed feedback — that comes at the end. Just acknowledge and transition."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Question was: {question.text}\n\nGenerate a brief acknowledgment."},
    ]

    return await chat(messages, model=CLASSIFIER_MODEL, temperature=0.5, max_tokens=80)


async def _generate_clarification(
    question: Question,
    transcript: str,
    persona_fragment: str,
) -> str:
    """Answer a clarifying question without revealing the solution."""
    system_prompt = f"""You are an AI interviewer. The candidate is asking a clarifying question.
Answer briefly without revealing the solution or giving hints about the answer.
Persona: {persona_fragment}"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Question: {question.text}\nCandidate asked: {transcript}\n\nAnswer the clarification."},
    ]

    return await chat(messages, model=CLASSIFIER_MODEL, temperature=0.5, max_tokens=100)


def _stall_nudge(persona_id: str) -> str:
    nudges = {
        "friendly": "Take your time — there's no rush. What's the first thing that comes to mind?",
        "neutral": "Take a moment and share your initial thoughts.",
        "challenging": "I need you to engage with the question. What's your approach?",
    }
    return nudges.get(persona_id, nudges["neutral"])
