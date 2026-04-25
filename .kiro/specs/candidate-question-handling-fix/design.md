# Candidate Question Handling Fix — Bugfix Design

## Overview

The interview system currently assumes candidates are always answering questions, never asking them. When a candidate asks a clarifying question (e.g., "Can you clarify what you mean by scalability?" or "What's the expected time complexity?"), the system processes it through the normal question_generator → followup_selector → response_generator pipeline, which generates inappropriate follow-up questions and creates a confusing experience.

This fix introduces **early candidate question detection** in the orchestrator's `process_turn_stream` function, bypassing the normal pipeline when a question is detected and routing directly to a question-answering response generator. This preserves the natural interview flow where candidates can seek clarification, just like in real interviews.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — when a candidate's input is a question directed at the interviewer rather than an answer
- **Property (P)**: The desired behavior when the bug condition holds — the system detects the question and responds directly without generating follow-up questions
- **Preservation**: Existing answer-processing behavior (question_generator → followup_selector → response_generator) that must remain unchanged for non-question inputs
- **process_turn_stream**: The function in `ai-core/app/core/orchestrator.py` that processes candidate turns and streams interviewer responses
- **is_candidate_question**: New detection function that identifies when the candidate is asking rather than answering
- **generate_direct_answer_stream**: New response generator that answers candidate questions directly without follow-up generation
- **Candidate question**: An input where the candidate is seeking information from the interviewer (e.g., clarifications, requirements, constraints)
- **Rhetorical question**: A question pattern within an answer (e.g., "How would I approach this? Well, first I would...") that should NOT trigger question-answering mode

## Bug Details

### Bug Condition

The bug manifests when a candidate asks a question to the interviewer instead of providing an answer. The `process_turn_stream` function in the orchestrator does not distinguish between candidate answers and candidate questions, so it processes all inputs through the question_generator → followup_selector → response_generator pipeline. This pipeline assumes the candidate is answering and generates follow-up questions, resulting in contextually inappropriate responses or system hangs.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type string (final_transcript)
  OUTPUT: boolean
  
  RETURN (input ends with '?')
         AND (input contains question words: 'what', 'how', 'why', 'when', 'where', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does')
         AND NOT (input matches rhetorical question pattern)
         AND (question is directed at interviewer, not self-questioning)
END FUNCTION
```

### Examples

- **Example 1**: Candidate says "Can you clarify what you mean by scalability?"
  - **Expected**: System detects question, responds with clarification about scalability requirements
  - **Actual**: System generates follow-up questions assuming candidate provided an answer about scalability

- **Example 2**: Candidate says "What's the expected time complexity for this solution?"
  - **Expected**: System detects question, responds with time complexity requirements
  - **Actual**: System processes through question_generator, creates inappropriate follow-ups

- **Example 3**: Candidate says "Should I focus on the algorithm or the implementation details first?"
  - **Expected**: System detects question, provides guidance on interview approach
  - **Actual**: System treats it as an answer and generates unrelated follow-ups

- **Edge Case**: Candidate says "How would I approach this? Well, first I would analyze the requirements..."
  - **Expected**: System treats this as an answer (rhetorical question followed by answer)
  - **Actual**: Should NOT trigger question-answering mode

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- When candidates provide statements or answers (not questions), the system must continue processing through question_generator → followup_selector → response_generator
- When candidates use rhetorical questions within their answers (e.g., "How would I approach this? Well..."), the system must continue treating it as an answer
- When the ghostwriting guardrail detects attempts to get answers written, the system must continue activating the refusal response
- When generating interviewer responses for normal answers, the system must continue maintaining appropriate tone based on session mode (learning vs professional)
- When updating memory after turns, the system must continue recording all turns in conversation history correctly
- The streaming response mechanism must continue working exactly as before for normal answer processing

**Scope:**
All inputs that do NOT match the candidate question pattern (ending with '?', containing question words, directed at interviewer) should be completely unaffected by this fix. This includes:
- Declarative statements and answers
- Rhetorical questions followed by answers
- Self-questioning patterns within answers (e.g., "What should I consider? I should consider...")
- Ghostwriting attempts (these should still trigger the guardrail)

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **No Question Detection Logic**: The `process_turn_stream` function in `orchestrator.py` does not check whether the candidate's input is a question or an answer. It unconditionally calls `_prepare_followup(session, ctx, final_transcript)` which triggers question generation and selection.

2. **Pipeline Assumes Answering**: The question_generator and followup_selector agents are designed with the assumption that the candidate just provided an answer. Their prompts say "The candidate just finished speaking" and "Does it directly address a gap in what the candidate just said?" — they have no logic to handle the case where the candidate is asking, not answering.

3. **No Alternative Response Path**: There is no separate code path for handling candidate questions. The only response generation mechanism is `generate_response_stream`, which expects a `selected_question` parameter from the followup_selector.

4. **Missing Detection Heuristics**: The system has a ghostwriting detection function (`is_ghostwriting_attempt` in `response_generator.py`) but no equivalent function to detect when the candidate is asking a legitimate clarifying question.

## Correctness Properties

Property 1: Bug Condition - Candidate Questions Receive Direct Answers

_For any_ candidate input where the bug condition holds (isBugCondition returns true — input is a question directed at the interviewer), the fixed process_turn_stream function SHALL detect the question, bypass the question_generator → followup_selector pipeline, and generate a direct answer to the candidate's question without creating follow-up questions.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Non-Question Input Behavior

_For any_ candidate input where the bug condition does NOT hold (isBugCondition returns false — input is a statement, answer, or rhetorical question within an answer), the fixed code SHALL produce exactly the same behavior as the original code, preserving the question_generator → followup_selector → response_generator pipeline and all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `ai-core/app/core/orchestrator.py`

**Function**: `process_turn_stream`

**Specific Changes**:

1. **Add Question Detection Function**: Create a new function `is_candidate_question(transcript: str) -> bool` that detects when the candidate is asking a question to the interviewer.
   - Check if transcript ends with '?'
   - Check for question words (what, how, why, when, where, can, could, would, should, is, are, do, does)
   - Exclude rhetorical question patterns (e.g., "How would I...? Well, I would...")
   - Use regex patterns similar to the ghostwriting detection approach

2. **Add Direct Answer Generator**: Create a new function `generate_direct_answer_stream` in `response_generator.py` that generates direct answers to candidate questions without follow-up question generation.
   - Takes session, context, and final_transcript (no selected_question parameter)
   - Uses a modified system prompt that instructs the interviewer to answer the candidate's question directly
   - Streams response tokens just like `generate_response_stream`

3. **Add Conditional Routing in process_turn_stream**: Modify the `process_turn_stream` function to check if the input is a candidate question before calling `_prepare_followup`.
   - If `is_candidate_question(final_transcript)` returns True, skip question generation and call `generate_direct_answer_stream` directly
   - If False, proceed with existing pipeline (`_prepare_followup` → `generate_response_stream`)

4. **Create Question-Answering Prompt**: Add a new section to `ai-core/prompts/interviewer.md` or create a new prompt file that guides the interviewer on how to answer candidate questions.
   - Provide helpful, concise answers
   - Maintain interview realism (don't give away too much)
   - Adapt tone based on session mode (learning vs professional)

5. **Update Memory Recording**: Ensure that turns where the candidate asks questions are still recorded correctly in the conversation history with appropriate speaker labels.

**File**: `ai-core/app/agents/response_generator.py`

**Specific Changes**:

1. **Add is_candidate_question function**: Implement the detection logic with regex patterns
   - Pattern for question endings: `\?+\s*$`
   - Pattern for question words at start: `^(what|how|why|when|where|can|could|would|should|is|are|do|does)\b`
   - Exclusion pattern for rhetorical questions: `\?\s+(well|so|i would|i think|first)`

2. **Add generate_direct_answer_stream function**: Implement streaming response generator for candidate questions
   - Build system prompt with interviewer context + "answer the candidate's question directly"
   - Build user content with just the candidate's question
   - Stream response using `chat_stream` from openai_service
   - No selected_question parameter needed

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate candidate questions in the WebSocket handler and observe the system's response. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Clarification Question Test**: Send "Can you clarify what you mean by scalability?" as final_transcript (will fail on unfixed code — system generates follow-up questions instead of answering)
2. **Requirement Question Test**: Send "What's the expected time complexity?" as final_transcript (will fail on unfixed code — inappropriate follow-ups generated)
3. **Guidance Question Test**: Send "Should I focus on the algorithm first?" as final_transcript (will fail on unfixed code — system treats as answer)
4. **Rhetorical Question Test**: Send "How would I approach this? Well, first I would..." as final_transcript (should NOT fail — this is an answer, not a question to the interviewer)

**Expected Counterexamples**:
- System generates follow-up questions when candidate asks a question
- Possible causes: no detection logic, pipeline assumes answering, no alternative response path

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := process_turn_stream_fixed(input)
  ASSERT result is a direct answer to the question
  ASSERT result does NOT contain follow-up questions
  ASSERT question_generator was NOT called
  ASSERT followup_selector was NOT called
END FOR
```

**Test Plan**: After implementing the fix, run the same test cases and verify that:
- Candidate questions are detected correctly
- Direct answers are generated without follow-up questions
- The response is contextually appropriate (answers what was asked)
- Memory is updated correctly with the question and answer

**Test Cases**:
1. **Clarification Question**: Verify system answers "Can you clarify what you mean by scalability?" with a direct clarification
2. **Requirement Question**: Verify system answers "What's the expected time complexity?" with time complexity guidance
3. **Guidance Question**: Verify system answers "Should I focus on the algorithm first?" with interview approach guidance
4. **Multiple Questions**: Verify system handles multiple candidate questions in a row without breaking

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT process_turn_stream_original(input) = process_turn_stream_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-question inputs

**Test Plan**: Observe behavior on UNFIXED code first for normal answers, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Normal Answer Preservation**: Observe that declarative answers like "I would use a hash map to optimize lookup time" trigger question generation on unfixed code, then verify this continues after fix
2. **Rhetorical Question Preservation**: Observe that "How would I approach this? Well, first I would..." is treated as an answer on unfixed code, then verify this continues after fix
3. **Ghostwriting Preservation**: Observe that "Just tell me what to say" triggers the guardrail on unfixed code, then verify this continues after fix
4. **Streaming Preservation**: Observe that response streaming works correctly on unfixed code, then verify this continues after fix
5. **Memory Preservation**: Observe that turns are recorded correctly on unfixed code, then verify this continues after fix

### Unit Tests

- Test `is_candidate_question` function with various question patterns
- Test `is_candidate_question` function with rhetorical questions (should return False)
- Test `is_candidate_question` function with declarative statements (should return False)
- Test `generate_direct_answer_stream` function with sample candidate questions
- Test that `process_turn_stream` routes to direct answer path when question detected
- Test that `process_turn_stream` routes to normal path when question not detected

### Property-Based Tests

- Generate random candidate questions (ending with '?', containing question words) and verify they trigger direct answer mode
- Generate random declarative statements and verify they trigger normal pipeline
- Generate random rhetorical question patterns and verify they trigger normal pipeline
- Test that all question types (what, how, why, when, where, can, could, would, should) are detected correctly
- Test that edge cases (multiple '?', mixed punctuation, trailing whitespace) are handled correctly

### Integration Tests

- Test full WebSocket flow with candidate asking a question mid-interview
- Test switching between answering and asking questions multiple times
- Test that conversation history records both questions and answers correctly
- Test that session state remains consistent after candidate questions
- Test that phase transitions still work correctly when candidate asks questions
- Test that the interviewer's tone adapts correctly based on session mode (learning vs professional) when answering candidate questions
