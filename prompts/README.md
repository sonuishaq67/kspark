# Prompts — LLM Prompt Templates

This directory contains versioned LLM prompt templates used across services.

## Ownership by Prefix

### p1_* — Person 1
- `p1_research_brief.md` — Summarizes Tavily results into company profile schema

### p2_* — Person 2
- `p2_classify_turn.md` — Classifies turn as complete/partial/clarify/stall
- `p2_generate_probe.md` — Generates follow-up probe targeting specific gap
- `p2_generate_feedback.md` — Generates 8-metric feedback from transcript + signals
- `p2_safe_clarification.md` — Answers clarifying question without revealing solution
- `p2_streaming_predecide.md` — Ranks candidate next utterances from partial transcript
- `p2_scaffold_refusal.md` — Refuses ghostwriting attempts (mode-aware tone)

### p3_* — Person 3
- `p3_socratic_step.md` — Generates Socratic learning response (≤4 sentences, ends in question)

## Versioning

When changing a prompt, create a new version:
```
p2_generate_probe.md       # Current version
p2_generate_probe.v2.md    # New version
```

Old versions stay in the repo for replay and A/B testing.

## Structure

Each prompt file should include:

```markdown
# Prompt Name

## Context
What this prompt is used for

## Input Variables
- `variable_name`: description

## Output Format
Expected output structure (JSON, text, etc.)

## Examples
### Example 1
Input: ...
Output: ...

---

## Prompt

[The actual prompt text goes here]
```

## Usage

Prompts are loaded by the reasoning service and logged with:
- Prompt version
- Input hash
- Latency
- Token count

This enables prompt performance tracking and regression detection.
