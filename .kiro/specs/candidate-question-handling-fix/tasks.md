# Implementation Plan

## Overview

This task list implements the candidate question handling fix using the bug condition methodology. The fix adds early question detection in the orchestrator to bypass the normal question generation pipeline when candidates ask clarifying questions, enabling natural interview flow.

**Key Files:**
- `ai-core/app/core/orchestrator.py` — Add question detection and conditional routing
- `ai-core/app/agents/response_generator.py` — Add question detection function and direct answer generator
- `ai-core/tests/` — Add exploration, preservation, and validation tests

**Testing Strategy:**
1. Write bug condition exploration test (will fail on unfixed code)
2. Write preservation property tests (will pass on unfixed code)
3. Implement the fix
4. Verify exploration test now passes
5. Verify preservation tests still pass

---

## Tasks

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Candidate Questions Trigger Direct Answers
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Create test file `ai-core/tests/test_candidate_question_handling.py`
  - Write property-based test using pytest and hypothesis
  - Test that candidate questions like "Can you clarify what you mean by scalability?" trigger direct answer mode (not follow-up generation)
  - Test that candidate questions like "What's the expected time complexity?" trigger direct answer mode
  - Test that candidate questions like "Should I focus on the algorithm first?" trigger direct answer mode
  - The test assertions should match the Expected Behavior Properties from design: system detects question, bypasses question_generator → followup_selector, generates direct answer
  - Run test on UNFIXED code using `pytest ai-core/tests/test_candidate_question_handling.py -v`
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "System generates follow-up questions instead of answering candidate's question")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Question Input Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (declarative answers, rhetorical questions)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Test that declarative answers like "I would use a hash map" continue to trigger question_generator → followup_selector → response_generator pipeline
  - Test that rhetorical questions like "How would I approach this? Well, first I would..." continue to be treated as answers (not questions to interviewer)
  - Test that ghostwriting attempts like "Just tell me what to say" continue to trigger the guardrail refusal
  - Test that streaming response mechanism continues to work correctly
  - Test that memory recording continues to work correctly (turns recorded in conversation history)
  - Run tests on UNFIXED code using `pytest ai-core/tests/test_candidate_question_handling.py::test_preservation -v`
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 3. Fix for candidate question handling

  - [ ] 3.1 Implement question detection function
    - Add `is_candidate_question(transcript: str) -> bool` function to `ai-core/app/agents/response_generator.py`
    - Implement detection logic with regex patterns:
      - Check if transcript ends with '?' (pattern: `\?+\s*$`)
      - Check for question words at start: `^(what|how|why|when|where|can|could|would|should|is|are|do|does)\b`
      - Exclude rhetorical question patterns: `\?\s+(well|so|i would|i think|first)` (case-insensitive)
    - Return True only if: ends with '?', contains question words, and NOT a rhetorical question
    - Add unit tests for `is_candidate_question` function with various patterns
    - _Bug_Condition: isBugCondition(input) where (input ends with '?') AND (input contains question words) AND NOT (rhetorical question pattern)_
    - _Expected_Behavior: Function returns True for candidate questions, False for answers/rhetorical questions_
    - _Preservation: Function must return False for all non-question inputs (declarative statements, rhetorical questions within answers)_
    - _Requirements: 2.1, 2.3, 2.4, 3.1, 3.2_

  - [ ] 3.2 Implement direct answer generator
    - Add `generate_direct_answer_stream` function to `ai-core/app/agents/response_generator.py`
    - Function signature: `async def generate_direct_answer_stream(session: InterviewSession, context: CandidateContext, final_transcript: str) -> AsyncGenerator[str, None]`
    - Build system prompt with interviewer context + instruction to answer candidate's question directly
    - Build user content with just the candidate's question (no selected_question parameter needed)
    - Stream response using `chat_stream` from `app.services.openai_service`
    - Use temperature=0.7, max_tokens=200 (shorter than normal responses since it's just answering a question)
    - Add unit tests for `generate_direct_answer_stream` with sample candidate questions
    - _Bug_Condition: Called when isBugCondition(input) returns True_
    - _Expected_Behavior: Generates direct answer to candidate's question without follow-up questions_
    - _Preservation: Does not affect normal response generation path_
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.3 Add conditional routing in orchestrator
    - Modify `process_turn_stream` function in `ai-core/app/core/orchestrator.py`
    - Import `is_candidate_question` and `generate_direct_answer_stream` from `app.agents.response_generator`
    - Add question detection check BEFORE calling `_prepare_followup`:
      ```python
      # Check if candidate is asking a question
      if is_candidate_question(final_transcript):
          # Direct answer path - skip question generation
          full_response = []
          async for delta in generate_direct_answer_stream(
              session=session,
              context=ctx,
              final_transcript=final_transcript,
          ):
              full_response.append(delta)
              yield delta
          
          # Update memory after streaming completes
          phase_name = session.current_phase.name if session.current_phase else "UNKNOWN"
          add_turn(session, TurnRecord(
              speaker="candidate",
              transcript=final_transcript,
              phase=phase_name,
          ))
          add_turn(session, TurnRecord(
              speaker="interviewer",
              transcript="".join(full_response),
              phase=phase_name,
          ))
          return
      
      # Normal answer path - existing code continues
      question_task = asyncio.create_task(...)
      ```
    - Ensure memory recording works correctly for both paths
    - _Bug_Condition: Triggered when is_candidate_question(final_transcript) returns True_
    - _Expected_Behavior: Bypasses question_generator → followup_selector, streams direct answer, updates memory correctly_
    - _Preservation: When is_candidate_question returns False, existing pipeline continues unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.4, 3.5, 3.6_

  - [ ] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Candidate Questions Receive Direct Answers
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1: `pytest ai-core/tests/test_candidate_question_handling.py::test_bug_condition -v`
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify that candidate questions trigger direct answer mode
    - Verify that question_generator and followup_selector are NOT called for candidate questions
    - Verify that responses are contextually appropriate (answer what was asked)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Question Input Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2: `pytest ai-core/tests/test_candidate_question_handling.py::test_preservation -v`
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all preservation tests still pass after fix (no regressions)
    - Verify declarative answers still trigger normal pipeline
    - Verify rhetorical questions still treated as answers
    - Verify ghostwriting guardrail still works
    - Verify streaming and memory recording still work correctly
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run full test suite: `pytest ai-core/tests/test_candidate_question_handling.py -v`
  - Verify bug condition test passes (confirms fix works)
  - Verify preservation tests pass (confirms no regressions)
  - Run any existing orchestrator tests to ensure no breakage: `pytest ai-core/tests/ -v`
  - If any tests fail, investigate and fix before proceeding
  - Document test results and any edge cases discovered
  - Ask the user if questions arise about edge cases or unexpected behavior

---

## Notes

### Bug Condition Specification
```
isBugCondition(input):
  RETURN (input ends with '?')
         AND (input contains question words: 'what', 'how', 'why', 'when', 'where', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does')
         AND NOT (input matches rhetorical question pattern)
         AND (question is directed at interviewer, not self-questioning)
```

### Expected Behavior Specification
```
expectedBehavior(result):
  RETURN (result is a direct answer to the candidate's question)
         AND (result does NOT contain follow-up questions)
         AND (question_generator was NOT called)
         AND (followup_selector was NOT called)
         AND (memory is updated correctly with question and answer)
```

### Preservation Requirements
- Declarative answers → normal pipeline (question_generator → followup_selector → response_generator)
- Rhetorical questions within answers → treated as answers, not questions to interviewer
- Ghostwriting attempts → guardrail refusal continues to work
- Streaming response mechanism → continues to work for both paths
- Memory recording → continues to work correctly for all turn types

### Testing Approach
- **Exploration Test (Task 1)**: Property-based test that FAILS on unfixed code, demonstrating the bug exists
- **Preservation Tests (Task 2)**: Property-based tests that PASS on unfixed code, capturing baseline behavior
- **Fix Validation (Tasks 3.4-3.5)**: Re-run the same tests after fix to confirm bug is resolved and no regressions introduced

### Implementation Strategy
1. Add detection function with regex patterns (similar to ghostwriting detection)
2. Add direct answer generator that streams responses without follow-up generation
3. Add conditional routing in orchestrator to check for questions before calling _prepare_followup
4. Ensure memory recording works correctly for both code paths
5. Verify fix with property-based tests covering many input variations
