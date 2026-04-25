"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TranscriptBubble from "@/components/roleready/TranscriptBubble";
import LiveGapPanel from "@/components/roleready/LiveGapPanel";
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

export default function CodingRoom({
  sessionId,
  introMessage,
  sessionType,
  mode,
  phases,
  durationMinutes,
}: CodingRoomProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputText, setInputText] = useState("");
  const [code, setCode] = useState(STARTER_CODE);
  const [language, setLanguage] = useState("python");
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);

  const socket = useInterviewSocket(sessionId);
  const { isConnected, sendCodeUpdate } = socket;
  const introTurn: ConversationTurn = { speaker: "interviewer", text: introMessage };
  const currentPhase = socket.currentPhase ?? phases[0] ?? "CODING";
  const currentPhaseIndex =
    socket.currentPhaseIndex || Math.max(0, phases.indexOf(currentPhase));

  useEffect(() => {
    if (socket.isComplete) return;
    const interval = setInterval(() => {
      setTimeRemaining((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [socket.isComplete]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [socket.conversation, socket.streamingText, socket.isThinking]);

  useEffect(() => {
    if (!isConnected) return;
    const timer = setTimeout(() => {
      sendCodeUpdate(code, language);
    }, 1000);
    return () => clearTimeout(timer);
  }, [code, language, isConnected, sendCodeUpdate]);

  const handleSubmit = useCallback(() => {
    const text = inputText.trim();
    if (!text || socket.isThinking || socket.streamingText) return;

    setInputText("");
    socket.sendSpeechStarted();
    socket.sendSpeechEnded(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [inputText, socket]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
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
    <div className="grid h-[calc(100vh-7rem)] gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="flex min-h-0 flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <LiveGapPanel
              currentPhase={currentPhase}
              currentPhaseIndex={currentPhaseIndex}
              totalPhases={phases.length}
              timeRemaining={timeRemaining}
            />
          </div>
          <div className="shrink-0 rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              {sessionType.replace(/_/g, " ")}
            </p>
            <p className="mt-1 text-xs text-gray-400 capitalize">{mode} mode</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex flex-col gap-3">
            {turns.map((turn, i) => (
              <TranscriptBubble key={`${turn.speaker}-${i}`} turn={turn} />
            ))}

            {socket.streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-xl rounded-bl-sm border border-gray-700/50 bg-gray-800 px-4 py-3 text-sm leading-relaxed text-gray-100">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                    Interviewer
                  </p>
                  <p className="whitespace-pre-wrap">{socket.streamingText}</p>
                  <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-indigo-400" />
                </div>
              </div>
            )}

            {socket.isThinking && !socket.streamingText && (
              <div className="flex justify-start">
                <div className="rounded-xl rounded-bl-sm border border-gray-700/50 bg-gray-800 px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {socket.report ? (
          <div className="rounded-xl border border-indigo-700/40 bg-indigo-950/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              Session Complete
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-100">
              Overall Score: <span className="text-indigo-300">{socket.report.overall_score}/10</span>
            </p>
          </div>
        ) : (
          <div className="flex items-end gap-3 rounded-xl border border-gray-800 bg-gray-900/70 p-3">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isInputDisabled}
              placeholder={
                isInputDisabled
                  ? "Interviewer is responding..."
                  : "Explain your approach or answer the interviewer..."
              }
              rows={3}
              className="flex-1 resize-none rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:border-indigo-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSubmit}
                disabled={isInputDisabled || !inputText.trim()}
                aria-label="Send answer"
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
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
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-700 text-gray-400 transition-colors hover:border-red-700/50 hover:text-red-400 disabled:opacity-40"
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
        )}
      </section>

      <section className="flex min-h-0 flex-col gap-3">
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
