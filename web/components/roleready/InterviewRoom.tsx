"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TranscriptBubble from "./TranscriptBubble";
import LiveGapPanel from "./LiveGapPanel";
import GhostwritingGuardrailBadge from "./GhostwritingGuardrailBadge";
import { api } from "@/lib/api";
import { AICoreReport, ConversationTurn } from "@/lib/types";

interface InterviewRoomProps {
  sessionId: string;
  introMessage: string;
  sessionType: string;
  mode: string;
  phases: string[];
  durationMinutes: number;
}

type RoomStatus = "idle" | "thinking" | "streaming" | "complete" | "ending";

export default function InterviewRoom({
  sessionId,
  introMessage,
  sessionType,
  mode,
  phases,
  durationMinutes,
}: InterviewRoomProps) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Conversation state
  const [conversation, setConversation] = useState<ConversationTurn[]>([
    { speaker: "interviewer", text: introMessage },
  ]);
  const [streamingText, setStreamingText] = useState("");
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState<RoomStatus>("idle");

  // Session state
  const [currentPhase, setCurrentPhase] = useState<string | null>(
    phases[0] ?? null
  );
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const [guardrailCount, setGuardrailCount] = useState(0);
  const [report, setReport] = useState<AICoreReport | null>(null);

  // Timer countdown
  useEffect(() => {
    if (status === "complete") return;
    const interval = setInterval(() => {
      setTimeRemaining((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, streamingText, status]);

  const handleSubmit = useCallback(async () => {
    const text = inputText.trim();
    if (!text || status === "thinking" || status === "streaming") return;

    setInputText("");
    setStatus("thinking");

    // Add candidate turn immediately
    setConversation((prev) => [...prev, { speaker: "candidate", text }]);

    try {
      const res = await api.aiCore.textTurn(sessionId, text);

      if (res.guardrail_activated) {
        setGuardrailCount((c) => c + 1);
      }

      // Simulate streaming by revealing text word by word
      const words = res.interviewer_response.split(" ");
      setStatus("streaming");
      let built = "";

      for (const word of words) {
        built += (built ? " " : "") + word;
        setStreamingText(built);
        await new Promise((r) => setTimeout(r, 35));
      }

      setStreamingText("");
      setConversation((prev) => [
        ...prev,
        {
          speaker: "interviewer",
          text: res.interviewer_response,
          guardrail: res.guardrail_activated,
        },
      ]);

      // Update phase
      if (res.current_phase) {
        const idx = phases.indexOf(res.current_phase);
        setCurrentPhase(res.current_phase);
        if (idx >= 0) setCurrentPhaseIndex(idx);
      }

      if (res.is_session_complete) {
        setStatus("complete");
      } else {
        setStatus("idle");
        // Re-focus input
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } catch (err) {
      console.error("Turn failed:", err);
      setConversation((prev) => [
        ...prev,
        {
          speaker: "interviewer",
          text: "Something went wrong. Please try again.",
        },
      ]);
      setStatus("idle");
    }
  }, [inputText, sessionId, status, phases]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleEndSession = useCallback(async () => {
    if (status === "ending") return;
    setStatus("ending");

    try {
      const r = await api.aiCore.endSession(sessionId);
      setReport(r);
      setStatus("complete");
    } catch (err) {
      console.error("End session failed:", err);
      // Navigate to report anyway
      router.push(`/practice/report?session_id=${sessionId}`);
    }
  }, [sessionId, status, router]);

  const isInputDisabled =
    status === "thinking" || status === "streaming" || status === "ending";
  const isEnding = status === "ending";

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
      {/* Top bar — phase + timer */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <LiveGapPanel
            currentPhase={currentPhase}
            currentPhaseIndex={currentPhaseIndex}
            totalPhases={phases.length}
            timeRemaining={timeRemaining}
          />
        </div>

        {/* Session meta */}
        <div className="shrink-0 rounded-2xl border border-gray-800 bg-gray-900/70 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            {sessionType.replace(/_/g, " ")}
          </p>
          <p className="mt-1 text-xs text-gray-400 capitalize">{mode} mode</p>
        </div>
      </div>

      {/* Guardrail badge */}
      <GhostwritingGuardrailBadge activationCount={guardrailCount} />

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900/50 p-4">
        <div className="flex flex-col gap-3">
          {conversation.map((turn, i) => (
            <TranscriptBubble key={i} turn={turn} />
          ))}

          {/* Streaming text */}
          {streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[82%] rounded-2xl rounded-bl-sm border border-gray-700/50 bg-gray-800 px-4 py-3 text-sm leading-relaxed text-gray-100">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                  Interviewer
                </p>
                <p className="whitespace-pre-wrap">{streamingText}</p>
                <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-indigo-400" />
              </div>
            </div>
          )}

          {/* Thinking indicator */}
          {status === "thinking" && !streamingText && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-gray-700/50 bg-gray-800 px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                </div>
              </div>
            </div>
          )}

          {/* Session complete */}
          {status === "complete" && !report && (
            <div className="rounded-2xl border border-green-700/40 bg-green-950/30 p-4 text-center">
              <p className="text-sm font-semibold text-green-300">
                Session complete — generating your report...
              </p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      {status !== "complete" && status !== "ending" ? (
        <div className="flex items-end gap-3 rounded-2xl border border-gray-800 bg-gray-900/70 p-3">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isInputDisabled}
            placeholder={
              isInputDisabled
                ? "Interviewer is responding..."
                : "Type your answer... (Enter to send, Shift+Enter for new line)"
            }
            rows={3}
            className="flex-1 resize-none rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:border-indigo-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSubmit}
              disabled={isInputDisabled || !inputText.trim()}
              aria-label="Send answer"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
              </svg>
            </button>
            <button
              onClick={handleEndSession}
              disabled={isEnding}
              aria-label="End session"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-700 text-gray-400 transition-colors hover:border-red-700/50 hover:text-red-400 disabled:opacity-40"
              title="End session"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        /* Report CTA */
        report && (
          <div className="rounded-2xl border border-indigo-700/40 bg-indigo-950/40 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                  Session Complete
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-100">
                  Overall Score:{" "}
                  <span className="text-indigo-300">{report.overall_score}/10</span>
                </p>
              </div>
              <button
                onClick={() =>
                  router.push(`/practice/report?session_id=${sessionId}`)
                }
                className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                View Full Report →
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {report.strengths.slice(0, 2).map((s, i) => (
                <span
                  key={i}
                  className="rounded-full border border-green-700/40 bg-green-950/30 px-3 py-1 text-xs text-green-300"
                >
                  ✓ {s}
                </span>
              ))}
              {report.weaknesses.slice(0, 2).map((w, i) => (
                <span
                  key={i}
                  className="rounded-full border border-amber-700/40 bg-amber-950/30 px-3 py-1 text-xs text-amber-300"
                >
                  ↑ {w}
                </span>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
