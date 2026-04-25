"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TranscriptBubble from "@/components/roleready/TranscriptBubble";
import { useInterviewSocket } from "@/lib/useInterviewSocket";
import { ConversationTurn } from "@/lib/types";
import CodeEditor from "./CodeEditor";
import ReviewPanel from "./ReviewPanel";

interface CodingRoomProps {
  sessionId: string;
  introMessage: string;
  sessionType: string;
  mode: string;
  phases: string[];
  durationMinutes: number;
}

const STARTER_CODE = `def solve(nums):
    # Talk through your approach, then implement it here.
    pass
`;

const LANGUAGES = ["python", "javascript", "typescript", "java", "cpp"];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function phaseLabel(phase: string | null): string {
  if (!phase) return "Starting";
  return phase
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CodingRoom({
  sessionId,
  introMessage,
  sessionType,
  mode,
  phases,
  durationMinutes,
}: CodingRoomProps) {
  const conversationRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputText, setInputText] = useState("");
  const [code, setCode] = useState(STARTER_CODE);
  const [language, setLanguage] = useState("python");
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const lastSentCodeRef = useRef(`python:${STARTER_CODE}`);

  const socket = useInterviewSocket(sessionId);
  const { isConnected, sendCodeUpdate } = socket;
  const introTurn: ConversationTurn = { speaker: "interviewer", text: introMessage };
  const currentPhase = socket.currentPhase ?? phases[0] ?? "CODING";
  const currentPhaseIndex =
    socket.currentPhaseIndex ?? Math.max(0, phases.indexOf(currentPhase));

  useEffect(() => {
    if (socket.isComplete) return;
    const interval = setInterval(() => {
      setTimeRemaining((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [socket.isComplete]);

  useEffect(() => {
    const el = conversationRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [socket.conversation, socket.streamingText, socket.isThinking]);

  useEffect(() => {
    if (!isConnected) return;
    if (
      socket.reviewStatus === "reviewing" ||
      socket.isThinking ||
      socket.isSpeaking ||
      Boolean(socket.streamingText)
    ) {
      return;
    }

    const normalized = `${language}:${code}`;
    if (normalized === lastSentCodeRef.current) return;

    const timer = setTimeout(() => {
      if (normalized === lastSentCodeRef.current) return;
      lastSentCodeRef.current = normalized;
      sendCodeUpdate(code, language);
    }, 3500);

    return () => clearTimeout(timer);
  }, [
    code,
    language,
    isConnected,
    sendCodeUpdate,
    socket.reviewStatus,
    socket.isThinking,
    socket.isSpeaking,
    socket.streamingText,
  ]);

  const handleSubmit = useCallback(() => {
    const text = inputText.trim();
    if (!text || socket.isThinking || socket.streamingText) return;

    setInputText("");
    socket.sendSpeechStarted();
    socket.sendSpeechEnded(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [inputText, socket]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const turns = [introTurn, ...socket.conversation];
  const isInputDisabled =
    !socket.isConnected ||
    socket.isThinking ||
    Boolean(socket.streamingText) ||
    socket.isComplete;

  return (
    <div className="grid h-[calc(100vh-7.5rem)] min-h-[40rem] gap-4 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.25fr)]">
      <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#17211b]/10 bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                socket.isConnected ? "bg-emerald-600" : "animate-pulse bg-[#8b948e]"
              }`}
            />
            <span className="truncate text-sm font-semibold text-[#17211b]">
              {phaseLabel(currentPhase)}
            </span>
            {phases.length > 0 && (
              <span className="rounded-md bg-[#e7efe9] px-2 py-1 text-xs font-semibold text-[#536058]">
                {currentPhaseIndex + 1}/{phases.length}
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span
              className={`text-sm font-semibold tabular-nums ${
                timeRemaining < 120 ? "text-rose-700" : "text-[#17211b]"
              }`}
            >
              {formatTime(timeRemaining)}
            </span>
            <span className="hidden max-w-[16rem] truncate text-xs text-[#667169] sm:inline">
              {sessionType.replace(/_/g, " ")} - {mode}
            </span>
          </div>
        </div>

        <div ref={conversationRef} className="flex-1 overflow-y-auto overscroll-contain bg-[#f7f5ef] p-4">
          <div className="flex flex-col gap-3">
            {turns.map((turn, index) => (
              <TranscriptBubble key={`${turn.speaker}-${index}`} turn={turn} />
            ))}

            {socket.streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-lg border border-[#17211b]/10 bg-white px-4 py-3 text-sm leading-6 text-[#17211b] shadow-sm">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
                    Interviewer
                  </p>
                  <p className="whitespace-pre-wrap">{socket.streamingText}</p>
                  <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-[#17211b]" />
                </div>
              </div>
            )}

            {socket.isThinking && !socket.streamingText && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-[#17211b]/10 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#667169] [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#667169] [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#667169]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {socket.report ? (
          <div className="border-t border-[#17211b]/10 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
              Session complete
            </p>
            <p className="mt-1 text-sm font-semibold text-[#17211b]">
              Overall score: <span className="text-emerald-700">{socket.report.overall_score}/10</span>
            </p>
          </div>
        ) : (
          <div className="border-t border-[#17211b]/10 bg-white p-3">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isInputDisabled}
                placeholder={
                  isInputDisabled
                    ? "Interviewer is responding..."
                    : "Explain your approach or answer the interviewer..."
                }
                rows={3}
                className="min-h-[5.5rem] flex-1 resize-none rounded-lg border border-[#17211b]/15 bg-[#fcfbf7] px-4 py-3 text-sm leading-6 text-[#17211b] placeholder-[#8b948e] outline-none transition focus:border-[#17211b] disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={isInputDisabled || !inputText.trim()}
                  aria-label="Send answer"
                  title="Send answer"
                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#17211b] text-white transition hover:bg-[#2b3a31] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
                  </svg>
                </button>
                <button
                  onClick={socket.sendEndSession}
                  disabled={!socket.isConnected || socket.isComplete}
                  aria-label="End session"
                  title="End session"
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#17211b]/15 bg-white text-[#667169] transition hover:border-rose-300 hover:text-rose-700 disabled:opacity-40"
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
          </div>
        )}
      </section>

      <section className="flex min-h-0 flex-col gap-4">
        <CodeEditor
          code={code}
          language={language}
          languages={LANGUAGES}
          onCodeChange={setCode}
          onLanguageChange={setLanguage}
        />
        <ReviewPanel
          connectionStatus={socket.status}
          review={socket.codeReview}
          reviewStatus={socket.reviewStatus}
        />
      </section>
    </div>
  );
}
