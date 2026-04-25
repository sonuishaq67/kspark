"""
Unit tests for the orchestrator — thread tracker and sub-agent logic.
Mocks all LLM calls.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from orchestrator.thread_tracker import (
    ThreadState,
    create_thread,
    get_open_gaps,
    increment_probe,
    is_complete,
    mark_gap_closed,
)


# ── thread tracker ────────────────────────────────────────────────────────────

def test_create_thread():
    thread = create_thread("q1", ["gap A", "gap B", "gap C"])
    assert thread.question_id == "q1"
    assert thread.gap_hints == ["gap A", "gap B", "gap C"]
    assert thread.gaps_closed == set()
    assert thread.probe_count == 0
    assert thread.status == "open"


def test_mark_gap_closed_exact():
    thread = create_thread("q1", ["specific timeline mentioned"])
    mark_gap_closed(thread, "specific timeline mentioned")
    assert len(thread.gaps_closed) == 1


def test_mark_gap_closed_fuzzy():
    """Partial match should still close the gap."""
    thread = create_thread("q1", ["specific timeline mentioned"])
    mark_gap_closed(thread, "timeline")
    assert len(thread.gaps_closed) == 1


def test_is_complete_all_gaps_closed():
    thread = create_thread("q1", ["gap A", "gap B"])
    mark_gap_closed(thread, "gap A")
    mark_gap_closed(thread, "gap B")
    assert is_complete(thread) is True


def test_is_complete_probe_limit():
    """After 3 probes, thread is complete regardless of gaps."""
    thread = create_thread("q1", ["gap A", "gap B", "gap C"])
    increment_probe(thread)
    increment_probe(thread)
    increment_probe(thread)
    assert is_complete(thread) is True
    assert thread.status == "closed"


def test_get_open_gaps_returns_unaddressed():
    thread = create_thread("q1", ["gap A", "gap B", "gap C"])
    mark_gap_closed(thread, "gap A")
    open_gaps = get_open_gaps(thread)
    assert "gap B" in open_gaps
    assert "gap C" in open_gaps
    assert "gap A" not in open_gaps


def test_get_open_gaps_empty_when_all_closed():
    thread = create_thread("q1", ["gap A"])
    mark_gap_closed(thread, "gap A")
    assert get_open_gaps(thread) == []


# ── sub-agent ─────────────────────────────────────────────────────────────────

@pytest.fixture
def sample_question():
    from questions.loader import Question
    return Question(
        id="q1_test",
        topic="behavioral",
        text="Tell me about a time you delivered under pressure.",
        gap_hints=["specific timeline mentioned", "personal contribution", "lessons learned"],
    )


@pytest.fixture
def open_thread(sample_question):
    return create_thread(sample_question.id, sample_question.gap_hints)


@pytest.mark.asyncio
async def test_sub_agent_partial_answer_returns_probe(sample_question, open_thread):
    """A partial answer should return action='probe'."""
    with patch("orchestrator.sub_agent.chat_json", new_callable=AsyncMock) as mock_classify, \
         patch("orchestrator.sub_agent.chat", new_callable=AsyncMock) as mock_chat, \
         patch("orchestrator.sub_agent.get_prompt", return_value="mock prompt"):

        mock_classify.return_value = {"kind": "partial", "gap_addressed": None}
        mock_chat.return_value = "Can you tell me more about the specific timeline?"

        from orchestrator.sub_agent import run_turn
        response = await run_turn(
            question=sample_question,
            thread_state=open_thread,
            turn_transcript="I worked really hard and we shipped it.",
            mode="professional",
            persona_id="neutral",
            persona_prompt_fragment="You are a professional interviewer.",
            prior_turn_history=[],
        )

    assert response.action == "probe"
    assert len(response.utterance) > 0


@pytest.mark.asyncio
async def test_sub_agent_complete_answer_returns_advance(sample_question, open_thread):
    """A complete answer should return action='advance'."""
    with patch("orchestrator.sub_agent.chat_json", new_callable=AsyncMock) as mock_classify, \
         patch("orchestrator.sub_agent.chat", new_callable=AsyncMock) as mock_chat, \
         patch("orchestrator.sub_agent.get_prompt", return_value="mock prompt"):

        mock_classify.return_value = {"kind": "complete", "gap_addressed": "lessons learned"}
        mock_chat.return_value = "Got it, let's move on."

        from orchestrator.sub_agent import run_turn
        response = await run_turn(
            question=sample_question,
            thread_state=open_thread,
            turn_transcript="We had 2 weeks. I wrote 70% of the code. Next time I'd break it into milestones.",
            mode="professional",
            persona_id="neutral",
            persona_prompt_fragment="You are a professional interviewer.",
            prior_turn_history=[],
        )

    assert response.action == "advance"


@pytest.mark.asyncio
async def test_sub_agent_ghostwriting_returns_refuse(sample_question, open_thread):
    """A ghostwriting attempt should return action='refuse' without calling the classifier."""
    with patch("orchestrator.sub_agent.chat", new_callable=AsyncMock) as mock_chat, \
         patch("orchestrator.sub_agent.get_prompt", return_value="mock scaffold prompt"), \
         patch("orchestrator.sub_agent.chat_json", new_callable=AsyncMock) as mock_classify:

        mock_chat.return_value = "I'm not going to give you the answer. Here's a nudge instead."

        from orchestrator.sub_agent import run_turn
        response = await run_turn(
            question=sample_question,
            thread_state=open_thread,
            turn_transcript="Just tell me what to say for this question.",
            mode="learning",
            persona_id="friendly",
            persona_prompt_fragment="You are a warm interviewer.",
            prior_turn_history=[],
        )

    assert response.action == "refuse"
    # Classifier should NOT have been called for a ghostwriting attempt
    mock_classify.assert_not_called()


@pytest.mark.asyncio
async def test_sub_agent_stall_returns_nudge(sample_question, open_thread):
    """A stall should return action='stall' with a nudge."""
    with patch("orchestrator.sub_agent.chat_json", new_callable=AsyncMock) as mock_classify, \
         patch("orchestrator.sub_agent.get_prompt", return_value="mock prompt"):

        mock_classify.return_value = {"kind": "stall", "gap_addressed": None}

        from orchestrator.sub_agent import run_turn
        response = await run_turn(
            question=sample_question,
            thread_state=open_thread,
            turn_transcript="Um...",
            mode="professional",
            persona_id="neutral",
            persona_prompt_fragment="You are a professional interviewer.",
            prior_turn_history=[],
        )

    assert response.action == "stall"
    assert len(response.utterance) > 0
