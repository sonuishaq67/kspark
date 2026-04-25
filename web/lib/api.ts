import {
  AICoreReport,
  AICoreStartRequest,
  AICoreStartResponse,
  AICoreTextTurnResponse,
  SessionListItem,
} from "./types";

// ── Config ────────────────────────────────────────────────────────────────────

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const AI_CORE_URL =
  process.env.NEXT_PUBLIC_AI_CORE_URL ?? "http://localhost:8001";

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8001";

// ── Error class ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }
  return res.json() as Promise<T>;
}

async function requestForm<T>(url: string, body: FormData): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }
  return res.json() as Promise<T>;
}

// ── Legacy backend API (existing orchestrator) ────────────────────────────────

export interface Question {
  id: string;
  text: string;
  topic: string;
}

export interface ThreadSummaryItem {
  question_id: string;
  topic: string;
  question_text: string;
  status: string;
  gaps_probed: number;
  gaps_closed: string[];
  gaps_open: string[];
}

export interface LegacyReportResponse {
  session_id: string;
  started_at: string;
  ended_at: string | null;
  questions_completed: number;
  persona_id: string;
  tldr?: string;
  thread_summary?: ThreadSummaryItem[];
}

export const api = {
  // ── Legacy session (existing backend on :8000) ──────────────────────────

  createSession: (mode: string, persona_id: string) =>
    request<{ session_id: string; user_id: string; intro_message: string }>(
      `${BACKEND_URL}/api/sessions`,
      { method: "POST", body: JSON.stringify({ mode, persona_id }) }
    ),

  endSession: (sessionId: string) =>
    request<{ tldr: string; turns_count: number; questions_completed: number }>(
      `${BACKEND_URL}/api/sessions/${sessionId}/end`,
      { method: "POST" }
    ),

  listSessions: () =>
    request<SessionListItem[]>(`${BACKEND_URL}/api/sessions`),

  listQuestions: () =>
    request<Question[]>(`${BACKEND_URL}/api/questions`),

  getLegacyReport: (sessionId: string) =>
    request<LegacyReportResponse>(
      `${BACKEND_URL}/api/sessions/${sessionId}/report`
    ),

  getReport: (sessionId: string) =>
    request<import("./types").ReportResponse>(
      `${BACKEND_URL}/api/sessions/${sessionId}/report`
    ),

  finishSession: (sessionId: string) =>
    request<void>(`${BACKEND_URL}/api/sessions/${sessionId}/finish`, {
      method: "POST",
    }),

  // ── Research (Tavily-backed context prep on :8000) ─────────────────────

  research: {
    /**
     * Run Tavily research for the company/role and bundle resume + JD into a
     * markdown context_file the AI Core can ingest verbatim.
     */
    prepare: (body: {
      resume: string;
      job_description: string;
      company: string;
      role_type: string;
    }) =>
      request<{
        context_file: string;
        company: string;
        role: string;
        sources_count: number;
      }>(`${BACKEND_URL}/api/research/prepare`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  // ── Readiness / Gap Analysis ────────────────────────────────────────────

  readiness: {
    /**
     * Analyze candidate readiness by comparing resume to job description.
     * Returns readiness score and skill gaps categorized as strong/partial/missing.
     */
    analyze: (body: {
      job_description: string;
      resume: string;
      company?: string;
      role_type?: string;
      interview_type?: "behavioral" | "technical" | "coding" | "mixed";
    }) =>
      request<{
        session_id: string;
        readiness_score: number;
        summary: string;
        strong_matches: Array<{ label: string; evidence: string | null }>;
        partial_matches: Array<{ label: string; evidence: string | null }>;
        missing_or_weak: Array<{ label: string; evidence: string | null }>;
        interview_focus_areas: string[];
        prep_brief: string[];
      }>(`${BACKEND_URL}/api/readiness/analyze`, {
        method: "POST",
        body: JSON.stringify(body),
      }),

    /**
     * Get all gaps for a session, grouped by category.
     */
    getGaps: (sessionId: string) =>
      request<{
        session_id: string;
        strong: Array<{
          id: string;
          label: string;
          evidence: string | null;
          status: string;
        }>;
        partial: Array<{
          id: string;
          label: string;
          evidence: string | null;
          status: string;
        }>;
        missing: Array<{
          id: string;
          label: string;
          evidence: string | null;
          status: string;
        }>;
      }>(`${BACKEND_URL}/api/readiness/${sessionId}/gaps`),
  },

  // ── Resume parsing ─────────────────────────────────────────────────────

  resume: {
    parsePdf: (file: File) => {
      const body = new FormData();
      body.append("file", file);
      return requestForm<{
        filename: string;
        text: string;
        pages: number;
      }>(`${BACKEND_URL}/api/resume/parse-pdf`, body);
    },
  },

  // ── AI Core (new microservice on :8001) ────────────────────────────────

  aiCore: {
    startSession: (body: AICoreStartRequest) =>
      request<AICoreStartResponse>(`${AI_CORE_URL}/sessions/start`, {
        method: "POST",
        body: JSON.stringify(body),
      }),

    textTurn: (sessionId: string, transcript: string) =>
      request<AICoreTextTurnResponse>(
        `${AI_CORE_URL}/sessions/${sessionId}/text-test`,
        { method: "POST", body: JSON.stringify({ transcript }) }
      ),

    endSession: (sessionId: string) =>
      request<AICoreReport>(`${AI_CORE_URL}/sessions/${sessionId}/end`, {
        method: "POST",
      }),

    getStatus: (sessionId: string) =>
      request<{
        session_id: string;
        session_type: string;
        mode: string;
        current_phase: string | null;
        current_phase_index: number;
        total_phases: number;
        time_remaining_seconds: number;
        turns_count: number;
        is_complete: boolean;
      }>(`${AI_CORE_URL}/sessions/${sessionId}/status`),

    /** Convert text to speech via ElevenLabs. Returns base64 MP3. */
    tts: (text: string) =>
      request<{ audio: string }>(`${AI_CORE_URL}/tts`, {
        method: "POST",
        body: JSON.stringify({ text }),
      }),
  },
};
