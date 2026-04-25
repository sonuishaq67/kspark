// ── Session ───────────────────────────────────────────────────────────────────

export interface SessionListItem {
  session_id: string;
  started_at: string;
  ended_at: string | null;
  state: "PLANNING" | "INTRO" | "RUNNING_QUESTION" | "CLOSING" | "ENDED";
  mode: string;
  persona_id: string;
  questions_completed: number;
  tldr_preview?: string;
  target_role?: string;
  readiness_score?: number;
  main_gap?: string;
}

// ── Report ────────────────────────────────────────────────────────────────────

export interface GapReportItem {
  label: string;
  status: "closed" | "improved" | "open";
  evidence?: string;
}

export interface ReportScores {
  role_alignment: number;
  technical_clarity: number;
  communication: number;
  evidence_strength: number;
  followup_recovery: number;
}

export interface FollowUpAnalysisItem {
  question: string;
  reason: string;
  candidate_response_quality: "strong" | "weak" | "partial";
}

export interface ReportResponse {
  session_id: string;
  target_role: string | null;
  started_at: string;
  ended_at: string | null;
  readiness_score: number | null;
  summary: string;
  strengths: string[];
  gaps: GapReportItem[];
  scores: ReportScores;
  follow_up_analysis: FollowUpAnalysisItem[];
  next_practice_plan: string[];
}

// ── AI Core session (new microservice) ───────────────────────────────────────

export interface AICoreStartRequest {
  session_type: string;
  duration_minutes: number;
  mode: string;
  focus_area: string;
  context_file?: string;
  resume?: string;
  job_description?: string;
  company?: string;
  role_type?: string;
  difficulty?: string;
}

export interface AICoreStartResponse {
  session_id: string;
  intro_message: string;
  session_type: string;
  mode: string;
  duration_minutes: number;
  phases: string[];
}

export interface AICoreTextTurnResponse {
  session_id: string;
  interviewer_response: string;
  guardrail_activated: boolean;
  current_phase: string | null;
  is_session_complete: boolean;
  gaps: GapTrackingItem[];
  gap_addressed: string | null;
  gap_status_change: string | null;
}

export interface GapTrackingItem {
  label: string;
  category: "strong" | "partial" | "missing";
  status: "open" | "improved" | "closed";
  evidence: string | null;
}

export interface AICoreReport {
  session_id: string;
  session_type: string;
  overall_score: number;
  metric_scores: { metric: string; score: number; rationale: string }[];
  strengths: string[];
  weaknesses: string[];
  best_answer: string;
  weakest_answer: string;
  improved_answer_example: string;
  action_plan: string[];
  raw_feedback?: string;
}

// ── Live code review ─────────────────────────────────────────────────────────

export interface CodeReviewIssue {
  severity: "info" | "warning" | "error";
  line: number | null;
  category:
    | "correctness"
    | "edge_case"
    | "complexity"
    | "readability"
    | "testing"
    | "approach";
  message: string;
  hint: string;
}

export interface CodeReview {
  summary: string;
  status: "idle" | "reviewing" | "needs_attention" | "strong";
  issues: CodeReviewIssue[];
  next_prompt: string;
}

// ── WebSocket events ──────────────────────────────────────────────────────────

export type ServerEvent =
  | { type: "interviewer_text_delta"; delta: string; is_final: boolean }
  | { type: "interviewer_audio_chunk"; data: string }
  | { type: "interviewer_audio_done" }
  | { type: "candidate_transcript"; text: string; answer_number: number }
  | { type: "selected_question"; question: string; phase: string }
  | { type: "phase_update"; phase: string; description: string; phase_index: number; total_phases: number }
  | { type: "timer_update"; time_remaining_seconds: number; current_phase: string }
  | { type: "report_ready"; session_id: string; report: AICoreReport }
  | { type: "code_review"; language: string; review: CodeReview }
  | { type: "latency_metrics"; speech_end_to_question_selected_ms: number | null; total_turn_latency_ms: number | null }
  | { type: "error"; code: string; message: string };

export type ClientEvent =
  | { type: "speech_started" }
  | { type: "speech_ended"; final_transcript: string }
  | { type: "transcript_chunk"; text: string; is_final: boolean }
  | { type: "code_update"; code: string; language: string }
  | { type: "end_session" };

// ── Conversation ──────────────────────────────────────────────────────────────

export interface ConversationTurn {
  speaker: "candidate" | "interviewer" | "agent";
  text: string;
  phase?: string;
  guardrail?: boolean;
}
