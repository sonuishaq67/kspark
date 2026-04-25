# Bugfix Requirements Document

## Introduction

During coding interview sessions (and other interview types), when a candidate asks a question to the interviewer instead of answering (e.g., "Can you clarify what you mean by scalability?" or "What's the expected time complexity?"), the system appears to hang or not respond appropriately. The interviewer should recognize when the candidate is asking a question and respond directly to that question, just like a real interviewer would. This bug affects the natural flow of the interview and prevents candidates from seeking clarification, which is a realistic and expected behavior in actual interviews.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the candidate asks a clarifying question to the interviewer (e.g., "Can you clarify what you mean by scalability?") THEN the system appears to hang or does not respond appropriately

1.2 WHEN the candidate asks about requirements or constraints (e.g., "What's the expected time complexity?") THEN the system processes it through the normal question_generator → followup_selector → response_generator flow which assumes the candidate is answering, not asking

1.3 WHEN the candidate's input is a question directed at the interviewer THEN the question_generator creates follow-up questions assuming the candidate provided an answer, resulting in contextually inappropriate responses

1.4 WHEN the orchestrator processes a candidate question THEN none of the components (question_generator, followup_selector, response_generator) explicitly detect or handle the case where the candidate is asking rather than answering

### Expected Behavior (Correct)

2.1 WHEN the candidate asks a clarifying question to the interviewer THEN the system SHALL detect that the input is a question and respond directly to that question without generating follow-up questions

2.2 WHEN the candidate asks about requirements or constraints THEN the system SHALL provide a direct, helpful answer as a real interviewer would, without treating it as a candidate answer to be evaluated

2.3 WHEN the candidate's input is a question directed at the interviewer THEN the system SHALL bypass the normal question_generator → followup_selector flow and use a direct question-answering mode

2.4 WHEN the orchestrator processes a candidate question THEN it SHALL recognize the question pattern early in the pipeline and route to an appropriate question-answering handler

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the candidate provides a statement or answer (not a question) THEN the system SHALL CONTINUE TO process it through the normal question_generator → followup_selector → response_generator flow

3.2 WHEN the candidate's answer contains rhetorical questions or self-questioning (e.g., "How would I approach this? Well, first I would...") THEN the system SHALL CONTINUE TO treat it as an answer, not a question to the interviewer

3.3 WHEN the ghostwriting guardrail detects an attempt to get answers written for them THEN the system SHALL CONTINUE TO activate the refusal response

3.4 WHEN the candidate provides a complete answer and the interviewer needs to ask a follow-up THEN the system SHALL CONTINUE TO generate and select appropriate follow-up questions

3.5 WHEN the system generates interviewer responses THEN it SHALL CONTINUE TO maintain the appropriate tone based on session mode (learning vs professional)

3.6 WHEN the system processes turns and updates memory THEN it SHALL CONTINUE TO record all turns in the conversation history correctly
