"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VoiceOrb from "./VoiceOrb";
import GhostwritingGuardrailBadge from "./GhostwritingGuardrailBadge";
import { useVoiceAgent } from "@/lib/useVoiceAgent";
import { api } from "@/lib/api";
import { playBase64Audio } from "@/lib/audioPlayer";
import { ConversationTurn } from "@/lib/types";

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
  }, [agent.latestAgentText]);

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

  // ── Start session: play intro TTS then begin listening ─────────────────

  const handleStart = useCallback(async () => {
    setStarted(true);
    setIntroPlaying(true);

    // Play intro via ElevenLabs TTS
    try {
      const res = await api.aiCore.tts(introMessage);
      if (res.audio) {
        await playBase64Audio(res.audio);
      }
    } catch {
      // TTS failed — continue anyway
    }

    setIntroPlaying(false);
    // Start the voice agent (mic + recognition + silence detection)
    await agent.start();
  }, [introMessage, agent]);

  const handleStop = useCallback(() => {
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

      {agent.guardrailActivated && <GhostwritingGuardrailBadge activationCount={1} />}

      {/* ── Orb + text ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4">

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

      {/* ── Controls ────────────────────────────────────────────────────── */}
      {!agent.isSessionComplete && (
        <div className="flex w-full items-center justify-between px-6 pb-6 pt-2">
          {/* Transcript toggle */}
          <button
            onClick={() => setShowTranscript((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-gray-800 px-4 py-2 text-xs text-gray-500 transition-colors hover:border-gray-700 hover:text-gray-300"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M2 5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm0 5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm1 4a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2H3Z" clipRule="evenodd" />
            </svg>
            {showTranscript ? "Hide" : "Transcript"}
          </button>

          {/* Stop / End */}
          <div className="flex items-center gap-3">
            {started && agent.status !== "idle" && (
              <button
                onClick={handleStop}
                className="rounded-full border border-gray-700 px-4 py-2 text-xs text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-200"
              >
                Pause
              </button>
            )}
            <button
              onClick={handleEndSession}
              className="flex items-center gap-2 rounded-full border border-gray-800 px-4 py-2 text-xs text-gray-500 transition-colors hover:border-red-800/50 hover:text-red-400"
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
