"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VoiceOrb from "./VoiceOrb";
import GhostwritingGuardrailBadge from "./GhostwritingGuardrailBadge";
import { useInterviewSocket } from "@/lib/useInterviewSocket";
import { useMicrophone } from "@/lib/useMicrophone";
import { ConversationTurn } from "@/lib/types";
import { api } from "@/lib/api";
import { playBase64Audio } from "@/lib/audioPlayer";

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

  const socket = useInterviewSocket(sessionId);
  const mic = useMicrophone({ ws: socket.ws, onServerEvent: undefined });

  const [guardrailCount] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);

  // Seed the intro message into conversation once
  const [conversation, setConversation] = useState<ConversationTurn[]>([
    { speaker: "interviewer", text: introMessage },
  ]);

  // Speak the intro message via ElevenLabs TTS on mount
  const introSpokenRef = useRef(false);
  useEffect(() => {
    if (introSpokenRef.current || !introMessage) return;
    introSpokenRef.current = true;
    setIsSpeakingIntro(true);
    api.aiCore.tts(introMessage).then((res) => {
      if (res.audio) {
        return playBase64Audio(res.audio);
      }
    }).catch(() => {
      // TTS failed — intro is still shown as text
    }).finally(() => {
      setIsSpeakingIntro(false);
    });
  }, [introMessage]);

  const [isSpeakingIntro, setIsSpeakingIntro] = useState(false);

  // Merge socket conversation updates
  useEffect(() => {
    if (socket.conversation.length > 0) {
      setConversation([
        { speaker: "interviewer", text: introMessage },
        ...socket.conversation,
      ]);
    }
  }, [socket.conversation, introMessage]);

  // Timer (local countdown — server sends timer_update too but this is instant)
  useEffect(() => {
    if (socket.isComplete) return;
    const id = setInterval(() => setTimeRemaining((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [socket.isComplete]);

  // Sync server timer
  useEffect(() => {
    if (socket.timeRemaining > 0) setTimeRemaining(socket.timeRemaining);
  }, [socket.timeRemaining]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation, socket.streamingText]);

  // Navigate to report when done
  useEffect(() => {
    if (socket.isComplete && socket.report) {
      setTimeout(() => router.push(`/practice/report?session_id=${sessionId}`), 3000);
    }
  }, [socket.isComplete, socket.report, sessionId, router]);

  // ── Orb state ─────────────────────────────────────────────────────────────
  const orbState = (() => {
    if (mic.isRecording) return "listening" as const;
    if (socket.isSpeaking || isSpeakingIntro) return "speaking" as const;
    if (socket.isThinking) return "thinking" as const;
    return "idle" as const;
  })();

  // ── Latest agent text to show below orb ──────────────────────────────────
  const latestAgentText = socket.streamingText ||
    [...conversation].reverse().find((t) => t.speaker === "interviewer")?.text ||
    introMessage;

  // ── Mic tap handler ───────────────────────────────────────────────────────
  const handleMicPress = useCallback(async () => {
    if (socket.isThinking || socket.isSpeaking || socket.isComplete) return;

    if (mic.isRecording) {
      mic.stopRecording();
    } else {
      await mic.startRecording();
    }
  }, [mic, socket.isThinking, socket.isSpeaking, socket.isComplete]);

  const handleEndSession = useCallback(() => {
    if (mic.isRecording) mic.stopRecording();
    socket.sendEndSession();
  }, [mic, socket]);

  const isProcessing = (socket.isThinking || socket.isSpeaking || isSpeakingIntro) as boolean;
  const isActive = !socket.isComplete;

  return (
    <div className="relative flex h-[calc(100vh-7rem)] flex-col items-center overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex w-full items-center justify-between px-2 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            {phaseLabel(socket.currentPhase)}
          </span>
          {phases.length > 0 && (
            <div className="flex gap-1">
              {phases.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-5 rounded-full transition-all ${
                    i < socket.currentPhaseIndex
                      ? "bg-indigo-500"
                      : i === socket.currentPhaseIndex
                      ? "bg-indigo-400"
                      : "bg-gray-800"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Connection dot */}
          <span className={`h-1.5 w-1.5 rounded-full ${
            socket.isConnected ? "bg-green-500" : "bg-gray-600 animate-pulse"
          }`} />
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

      <GhostwritingGuardrailBadge activationCount={guardrailCount} />

      {/* ── Orb + text ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4">

        {/* Orb */}
        <div className="relative flex items-center justify-center">
          <VoiceOrb state={orbState} volume={mic.volume} />
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
              {mic.isRecording && "Listening..."}
              {socket.isThinking && !mic.isRecording && "Thinking..."}
              {socket.isSpeaking && "Speaking"}
              {isSpeakingIntro && !socket.isSpeaking && "Speaking"}
              {!mic.isRecording && !socket.isThinking && !socket.isSpeaking && !isSpeakingIntro && !socket.isComplete && "Tap to speak"}
              {socket.isComplete && "Done"}
            </span>
          </div>
        </div>

        {/* Live mic transcript echoed from server */}
        {mic.isRecording && mic.liveText && (
          <p className="max-w-md text-center text-sm italic leading-relaxed text-indigo-200/70">
            &ldquo;{mic.liveText.trim()}&rdquo;
          </p>
        )}

        {/* Agent message */}
        {!mic.isRecording && latestAgentText && (
          <div className="max-w-lg rounded-2xl border border-gray-800 bg-gray-900/60 px-5 py-4 text-center">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-400">
              Interviewer
            </p>
            <p className="text-sm leading-relaxed text-gray-100">
              {latestAgentText}
              {socket.streamingText && (
                <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-indigo-400" />
              )}
            </p>
          </div>
        )}
      </div>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      {isActive && (
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

          {/* Mic button */}
          <button
            onClick={handleMicPress}
            disabled={isProcessing}
            aria-label={mic.isRecording ? "Stop speaking" : "Start speaking"}
            className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:cursor-not-allowed disabled:opacity-40 ${
              mic.isRecording
                ? "bg-red-600 focus:ring-red-500 shadow-lg shadow-red-900/60"
                : "bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500 shadow-lg shadow-indigo-900/40"
            }`}
          >
            {mic.isRecording && (
              <>
                <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-20" />
                <span className="absolute inset-[-8px] animate-pulse rounded-full border border-red-500/30" />
              </>
            )}
            {mic.isRecording ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="relative z-10 h-8 w-8 text-white">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="relative z-10 h-8 w-8 text-white">
                <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 17.93V21H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.07A8.001 8.001 0 0 0 20 11a1 1 0 1 0-2 0 6 6 0 0 1-12 0 1 1 0 1 0-2 0 8.001 8.001 0 0 0 7 7.93z" />
              </svg>
            )}
          </button>

          {/* End session */}
          <button
            onClick={handleEndSession}
            className="flex items-center gap-2 rounded-full border border-gray-800 px-4 py-2 text-xs text-gray-500 transition-colors hover:border-red-800/50 hover:text-red-400"
          >
            End
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
            </svg>
          </button>
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
            {socket.streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-xl bg-gray-800 px-3 py-2 text-xs text-gray-200">
                  {socket.streamingText}
                  <span className="ml-0.5 inline-block h-2.5 w-0.5 animate-pulse bg-indigo-400" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Session complete overlay ─────────────────────────────────────── */}
      {socket.isComplete && socket.report && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/90 backdrop-blur">
          <div className="mx-4 w-full max-w-sm rounded-3xl border border-indigo-700/40 bg-gray-900 p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
              Session Complete
            </p>
            <p className="mt-3 text-4xl font-semibold text-gray-100">
              {socket.report.overall_score}
              <span className="text-xl text-gray-500">/10</span>
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {socket.report.strengths.slice(0, 2).map((s, i) => (
                <span key={i} className="rounded-full border border-green-700/40 bg-green-950/30 px-3 py-1 text-xs text-green-300">
                  ✓ {s}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-500">Redirecting to report...</p>
            <button
              onClick={() => router.push(`/practice/report?session_id=${sessionId}`)}
              className="mt-4 w-full rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              View Full Report →
            </button>
          </div>
        </div>
      )}

      {/* Mic / connection errors */}
      {(mic.error || socket.status === "error") && (
        <div className="absolute bottom-32 left-4 right-4 rounded-xl border border-red-800/50 bg-red-950/40 px-4 py-3 text-center text-xs text-red-300">
          {mic.error || "Connection error — please refresh"}
        </div>
      )}
    </div>
  );
}
