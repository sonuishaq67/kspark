"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VoiceOrb from "./VoiceOrb";
import GhostwritingGuardrailBadge from "./GhostwritingGuardrailBadge";
import LiveGapPanel from "./LiveGapPanel";
import { useVoiceAgent } from "@/lib/useVoiceAgent";
import { api } from "@/lib/api";
import { playBase64Audio } from "@/lib/audioPlayer";
import { ConversationTurn, GapTrackingItem } from "@/lib/types";

interface InterviewRoomProps {
  sessionId: string;
  introMessage: string;
  sessionType: string;
  mode: string;
  phases: string[];
  durationMinutes: number;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function phaseLabel(p: string | null) {
  if (!p) return "";
  return p.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function InterviewRoom({
  sessionId,
  introMessage,
  sessionType,
  mode,
  phases,
  durationMinutes,
}: InterviewRoomProps) {
  const router = useRouter();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const agent = useVoiceAgent(sessionId);

  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const [showTranscript, setShowTranscript] = useState(false);
  const [conversation, setConversation] = useState<ConversationTurn[]>([
    { speaker: "interviewer", text: introMessage },
  ]);
  const [started, setStarted] = useState(false);
  const [introPlaying, setIntroPlaying] = useState(false);
  const [gaps, setGaps] = useState<GapTrackingItem[]>([]);
  const [currentGap, setCurrentGap] = useState<string | null>(null);
  const [guardrailCount, setGuardrailCount] = useState(0);
  const [textInput, setTextInput] = useState("");

  // Timer
  useEffect(() => {
    if (agent.isSessionComplete) return;
    const id = setInterval(() => setTimeRemaining((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [agent.isSessionComplete]);

  // Track conversation from agent responses
  const lastAgentTextRef = useRef("");
  useEffect(() => {
    if (agent.latestAgentText && agent.latestAgentText !== lastAgentTextRef.current) {
      lastAgentTextRef.current = agent.latestAgentText;
      setConversation((prev) => [...prev, { speaker: "interviewer", text: agent.latestAgentText }]);
    }
    // Sync gap data from agent
    if (agent.gaps.length > 0) setGaps(agent.gaps);
    if (agent.currentGap) setCurrentGap(agent.currentGap);
    setGuardrailCount(agent.guardrailCount);
  }, [agent.latestAgentText, agent.gaps, agent.currentGap, agent.guardrailCount]);

  // Track user transcripts when they finish speaking
  const lastTranscriptRef = useRef("");
  useEffect(() => {
    if (agent.status === "processing" && agent.transcript === "" && lastTranscriptRef.current) {
      setConversation((prev) => [...prev, { speaker: "candidate", text: lastTranscriptRef.current }]);
      lastTranscriptRef.current = "";
    }
    if (agent.transcript) {
      lastTranscriptRef.current = agent.transcript;
    }
  }, [agent.status, agent.transcript]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation]);

  // Navigate to report when done
  useEffect(() => {
    if (agent.isSessionComplete) {
      agent.stop();
      setTimeout(() => router.push(`/practice/report?session_id=${sessionId}`), 2000);
    }
  }, [agent.isSessionComplete, sessionId, router, agent]);

  // Auto-play intro TTS on mount
  const introPlayedRef = useRef(false);
  useEffect(() => {
    if (introPlayedRef.current || !introMessage) return;
    introPlayedRef.current = true;
    setStarted(true);
    setIntroPlaying(true);
    api.aiCore.tts(introMessage).then((res) => {
      if (res.audio) return playBase64Audio(res.audio);
    }).catch(() => {}).finally(() => {
      setIntroPlaying(false);
      // Try to start voice agent (may fail if no mic permission — that's OK, text input works)
      agent.start().catch(() => {});
    });
  }, [introMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = useCallback(async () => {
    setStarted(true);
    setIntroPlaying(true);

    try {
      const res = await api.aiCore.tts(introMessage);
      if (res.audio) {
        await playBase64Audio(res.audio);
      }
    } catch {
      // TTS failed — continue anyway
    }

    setIntroPlaying(false);
    await agent.start();
  }, [introMessage, agent]);

  const handleStop = useCallback(() => { // eslint-disable-line @typescript-eslint/no-unused-vars
    agent.stop();
    setStarted(false);
  }, [agent]);

  const handleEndSession = useCallback(async () => {
    agent.stop();
    try {
      await api.aiCore.endSession(sessionId);
    } catch { /* ignore */ }
    router.push(`/practice/report?session_id=${sessionId}`);
  }, [agent, sessionId, router]);

  // ── Text input fallback ────────────────────────────────────────────────
  const handleTextSubmit = useCallback(async () => {
    const text = textInput.trim();
    if (!text || agent.status === "processing" || agent.status === "speaking") return;

    setTextInput("");
    setConversation((prev) => [...prev, { speaker: "candidate", text }]);

    // Use the agent's sendToAgent-like flow but via direct API call
    try {
      const res = await api.aiCore.textTurn(sessionId, text);
      setConversation((prev) => [
        ...prev,
        { speaker: "interviewer", text: res.interviewer_response, guardrail: res.guardrail_activated },
      ]);
      if (res.guardrail_activated) setGuardrailCount((c) => c + 1);
      if (res.gaps && res.gaps.length > 0) setGaps(res.gaps);
      if (res.gap_addressed) setCurrentGap(res.gap_addressed);

      // Play TTS for the response
      try {
        const tts = await api.aiCore.tts(res.interviewer_response);
        if (tts.audio) await playBase64Audio(tts.audio);
      } catch {
        // TTS failed — text is still shown
      }

      if (res.is_session_complete) {
        setTimeout(() => router.push(`/practice/report?session_id=${sessionId}`), 2000);
      }
    } catch {
      setConversation((prev) => [
        ...prev,
        { speaker: "interviewer", text: "Something went wrong. Please try again." },
      ]);
    }
  }, [textInput, sessionId, agent.status, router]);

  // ── Orb state mapping ──────────────────────────────────────────────────

  const orbState = (() => {
    if (introPlaying) return "speaking" as const;
    if (agent.status === "listening") return "listening" as const;
    if (agent.status === "processing") return "thinking" as const;
    if (agent.status === "speaking") return "speaking" as const;
    return "idle" as const;
  })();

  const orbVolume = agent.status === "listening" ? Math.min(1, agent.level / 80) : 0;

  // ── Latest text to show ────────────────────────────────────────────────

  const displayText = (() => {
    if (agent.status === "listening" && agent.transcript) return null; // show transcript instead
    if (agent.latestAgentText) return agent.latestAgentText;
    return introMessage;
  })();

  const statusLabel = (() => {
    if (introPlaying) return "Speaking";
    if (!started) return "Tap to begin";
    if (agent.status === "listening") return "Listening...";
    if (agent.status === "processing") return "Thinking...";
    if (agent.status === "speaking") return "Speaking";
    if (agent.isSessionComplete) return "Done";
    return "Tap to speak";
  })();

  return (
    <div className="relative flex h-[calc(100vh-10rem)] min-h-[32rem] flex-col items-center overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex w-full items-center justify-between px-2 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            {phaseLabel(agent.currentPhase || phases[0])}
          </span>
          {phases.length > 0 && (
            <div className="flex gap-1">
              {phases.map((_, i) => (
                <div key={i} className={`h-1 w-5 rounded-full transition-all ${
                  i === 0 ? "bg-indigo-400" : "bg-gray-800"
                }`} />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold tabular-nums ${
            timeRemaining < 120 ? "text-red-400" : "text-gray-400"
          }`}>
            {formatTime(timeRemaining)}
          </span>
          <span className="text-xs text-gray-600">
            {sessionType.replace(/_/g, " ")} · {mode}
          </span>
        </div>
      </div>

      {agent.guardrailActivated && <GhostwritingGuardrailBadge activationCount={guardrailCount} />}

      {/* ── Main: gap panel (left) + orb (center) ───────────────────────── */}
      <div className="flex flex-1 w-full gap-4 overflow-hidden px-4">

        {/* Gap panel sidebar */}
        {gaps.length > 0 && (
          <div className="hidden w-60 shrink-0 overflow-y-auto lg:block">
            <LiveGapPanel gaps={gaps} currentGap={currentGap} guardrailCount={guardrailCount} />
          </div>
        )}

        {/* Orb + text (center) */}
        <div className="flex flex-1 flex-col items-center justify-center gap-5">

        {/* Clickable orb area */}
        <button
          onClick={!started ? handleStart : agent.status === "idle" ? () => agent.start() : undefined}
          disabled={started && agent.status !== "idle"}
          className="relative flex items-center justify-center focus:outline-none disabled:cursor-default"
        >
          <VoiceOrb state={orbState} volume={orbVolume} />
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
              {statusLabel}
            </span>
          </div>
        </button>

        {/* Live transcript while user speaks */}
        {agent.status === "listening" && agent.transcript && (
          <p className="max-w-md text-center text-sm italic leading-relaxed text-indigo-200/70">
            &ldquo;{agent.transcript.trim()}&rdquo;
          </p>
        )}

        {/* Agent message */}
        {agent.status !== "listening" && displayText && (
          <div className="max-w-lg rounded-2xl border border-gray-800 bg-gray-900/60 px-5 py-4 text-center">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-400">
              Interviewer
            </p>
            <p className="text-sm leading-relaxed text-gray-100">
              {displayText}
              {agent.status === "speaking" && (
                <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-indigo-400" />
              )}
            </p>
          </div>
        )}
      </div>
      </div>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      {!agent.isSessionComplete && (
        <div className="flex w-full flex-col gap-3 px-4 pb-4 pt-2">
          {/* Text input — always available as fallback */}
          <div className="flex items-end gap-2">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleTextSubmit();
                }
              }}
              disabled={agent.status === "processing" || agent.status === "speaking" || introPlaying}
              placeholder={
                agent.status === "processing" ? "Thinking..."
                : agent.status === "speaking" ? "Interviewer speaking..."
                : "Type your answer or use the mic... (Enter to send)"
              }
              rows={2}
              className="flex-1 resize-none rounded-xl border border-[#17211b]/10 bg-white px-4 py-3 text-sm text-[#17211b] placeholder-[#667169] focus:border-indigo-400 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || agent.status === "processing" || agent.status === "speaking"}
              aria-label="Send"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#17211b] text-white transition-colors hover:bg-[#2b3a31] disabled:opacity-40"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
              </svg>
            </button>
          </div>

          {/* Bottom row: transcript toggle + voice status + end */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowTranscript((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-[#17211b]/10 px-3 py-1.5 text-xs text-[#667169] transition-colors hover:border-[#17211b]/20 hover:text-[#17211b]"
            >
              {showTranscript ? "Hide transcript" : "Show transcript"}
            </button>

            <div className="flex items-center gap-2 text-xs text-[#667169]">
              {agent.status === "listening" && (
                <span className="flex items-center gap-1 text-indigo-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                  Listening...
                </span>
              )}
              {agent.status === "processing" && (
                <span className="text-amber-600">Thinking...</span>
              )}
              {agent.status === "speaking" && (
                <span className="text-emerald-600">Speaking</span>
              )}
            </div>

            <button
              onClick={handleEndSession}
              className="rounded-full border border-[#17211b]/10 px-3 py-1.5 text-xs text-[#667169] transition-colors hover:border-rose-300 hover:text-rose-600"
            >
              End Session
            </button>
          </div>
        </div>
      )}

      {/* ── Transcript drawer ────────────────────────────────────────────── */}
      {showTranscript && (
        <div
          ref={transcriptRef}
          className="absolute bottom-28 left-4 right-4 max-h-60 overflow-y-auto rounded-2xl border border-gray-800 bg-gray-950/95 p-4 backdrop-blur"
        >
          <div className="flex flex-col gap-2">
            {conversation.map((turn, i) => (
              <div key={i} className={`flex ${turn.speaker === "candidate" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  turn.speaker === "candidate"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-200"
                }`}>
                  {turn.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Session complete overlay ─────────────────────────────────────── */}
      {agent.isSessionComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/90 backdrop-blur">
          <div className="mx-4 w-full max-w-sm rounded-3xl border border-indigo-700/40 bg-gray-900 p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
              Session Complete
            </p>
            <p className="mt-3 text-lg text-gray-300">Generating your report...</p>
            <button
              onClick={() => router.push(`/practice/report?session_id=${sessionId}`)}
              className="mt-6 w-full rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              View Report →
            </button>
          </div>
        </div>
      )}

      {/* Errors */}
      {agent.error && (
        <div className="absolute bottom-32 left-4 right-4 rounded-xl border border-red-800/50 bg-red-950/40 px-4 py-3 text-center text-xs text-red-300">
          {agent.error}
        </div>
      )}
    </div>
  );
}
