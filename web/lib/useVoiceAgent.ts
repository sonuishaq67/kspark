"use client";

/**
 * useVoiceAgent — Meridian-style voice agent hook.
 *
 * Pattern:
 *   1. Browser SpeechRecognition for STT (no server-side STT needed)
 *   2. Silence detection auto-stops recording after SILENCE_DURATION ms
 *   3. Sends transcript to AI Core via REST (POST /sessions/{id}/text-test)
 *   4. Splits response into sentences, fetches ElevenLabs TTS per sentence
 *   5. Pre-fetches next sentence while current plays
 *   6. Barge-in: user speaks over agent → cuts TTS, restarts listening
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";

// ── Constants ────────────────────────────────────────────────────────────────

const SILENCE_THRESHOLD = 10;     // RMS below this = silence
const SILENCE_DURATION = 2500;    // ms of silence before auto-stop
const MIN_SPEECH_MS = 800;        // ignore utterances shorter than this
const BARGE_IN_THRESHOLD = 28;    // mic RMS while agent speaks → interrupt
const BARGE_IN_MS = 350;          // sustained voice before we cut TTS

// ── Types ────────────────────────────────────────────────────────────────────

export type AgentStatus = "idle" | "listening" | "processing" | "speaking";

export interface VoiceAgentState {
  status: AgentStatus;
  level: number;                   // mic RMS 0-255
  transcript: string;              // current interim transcript
  latestAgentText: string;         // latest full agent response
  guardrailActivated: boolean;
  currentPhase: string | null;
  isSessionComplete: boolean;
  error: string | null;
  gaps: import("./types").GapTrackingItem[];
  currentGap: string | null;
  guardrailCount: number;
  start: () => Promise<void>;
  stop: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useVoiceAgent(sessionId: string): VoiceAgentState {
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [level, setLevel] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [latestAgentText, setLatestAgentText] = useState("");
  const [guardrailActivated, setGuardrailActivated] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gaps, setGaps] = useState<import("./types").GapTrackingItem[]>([]);
  const [currentGap, setCurrentGap] = useState<string | null>(null);
  const [guardrailCount, setGuardrailCount] = useState(0);

  // Refs for non-blocking updates
  const statusRef = useRef<AgentStatus>("idle");
  const activeRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechStartRef = useRef(0);
  const bargeInStartRef = useRef(0);
  const playbackCancelRef = useRef(false);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);

  // Sync status ref
  useEffect(() => { statusRef.current = status; }, [status]);

  // ── Stop TTS playback ──────────────────────────────────────────────────

  const stopPlayback = useCallback(() => {
    playbackCancelRef.current = true;
    if (audioElemRef.current) {
      audioElemRef.current.pause();
      audioElemRef.current = null;
    }
  }, []);

  // ── Audio analyser loop (runs continuously while active) ───────────────

  const startAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!activeRef.current) return;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let j = 0; j < data.length; j++) {
          const v = data[j] - 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setLevel(rms);

        // Silence detection while listening
        if (statusRef.current === "listening") {
          if (rms < SILENCE_THRESHOLD) {
            if (!silenceTimerRef.current && Date.now() - speechStartRef.current > MIN_SPEECH_MS) {
              silenceTimerRef.current = setTimeout(() => {
                if (statusRef.current === "listening") {
                  recognitionRef.current?.stop();
                }
              }, SILENCE_DURATION);
            }
          } else {
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          }
        }

        // Barge-in: user speaks while agent is speaking → interrupt
        if (statusRef.current === "speaking") {
          if (rms > BARGE_IN_THRESHOLD) {
            if (!bargeInStartRef.current) {
              bargeInStartRef.current = Date.now();
            } else if (Date.now() - bargeInStartRef.current > BARGE_IN_MS) {
              bargeInStartRef.current = 0;
              stopPlayback();
              startListening();
            }
          } else {
            bargeInStartRef.current = 0;
          }
        } else {
          bargeInStartRef.current = 0;
        }

        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {
      setError("Microphone access denied. Please allow mic access.");
    }
  }, [stopPlayback]);

  // ── Play a single audio blob (with polling for barge-in) ───────────────

  const playBlob = useCallback((blob: Blob) =>
    new Promise<void>((resolve) => {
      const url = URL.createObjectURL(blob);
      let pollHandle: number | null = null;
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        if (pollHandle !== null) window.clearInterval(pollHandle);
        URL.revokeObjectURL(url);
        audioElemRef.current = null;
        resolve();
      };

      const audio = new Audio(url);
      audioElemRef.current = audio;

      pollHandle = window.setInterval(() => {
        if (playbackCancelRef.current || !activeRef.current) {
          audio.pause();
          finish();
        }
      }, 64);

      audio.onended = finish;
      audio.onerror = finish;
      audio.play().catch(finish);
    }), []);

  // ── Fetch TTS for a single sentence ────────────────────────────────────

  const fetchTTSBlob = useCallback(async (sentence: string): Promise<Blob | null> => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AI_CORE_URL ?? "http://localhost:8001"}/tts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sentence }),
        }
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.audio) return null;
      const binary = atob(data.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: "audio/mpeg" });
    } catch {
      return null;
    }
  }, []);

  // ── Sentence-level TTS pipeline ────────────────────────────────────────

  const playElevenLabs = useCallback(async (text: string) => {
    if (!text.trim()) return;
    playbackCancelRef.current = false;
    setStatus("speaking");

    // Strip markdown for clean speech
    let clean = text.replace(/```[\s\S]*?```/g, "");
    clean = clean.replace(/^#{1,6}\s+/gm, "");
    clean = clean.replace(/\*\*([^*]+)\*\*/g, "$1");
    clean = clean.replace(/__([^_]+)__/g, "$1");
    clean = clean.replace(/^\s*[-*+]\s+/gm, "");
    clean = clean.replace(/`+/g, "");
    clean = clean.trim();

    const sentences = clean.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
    if (sentences.length === 0) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      startListening();
      return;
    }

    // Pre-fetch first sentence
    let nextBlobPromise: Promise<Blob | null> = fetchTTSBlob(sentences[0]);

    for (let i = 0; i < sentences.length; i++) {
      if (playbackCancelRef.current || !activeRef.current) break;

      const blob = await nextBlobPromise;

      // Pre-fetch next sentence while current plays
      if (i + 1 < sentences.length) {
        nextBlobPromise = fetchTTSBlob(sentences[i + 1]);
      }

      if (blob && blob.size > 0 && !playbackCancelRef.current) {
        await playBlob(blob);
      }
    }

    if (activeRef.current && !playbackCancelRef.current) {
      startListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTTSBlob, playBlob]);

  // ── Send transcript to AI Core and play response ───────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sendToAgent = useCallback(async (text: string) => {
    if (!text.trim() || text.trim().length < 2) {
      startListening();
      return;
    }

    setStatus("processing");
    setTranscript("");

    try {
      const res = await api.aiCore.textTurn(sessionId, text.trim());
      setLatestAgentText(res.interviewer_response);
      setGuardrailActivated(res.guardrail_activated);
      if (res.guardrail_activated) setGuardrailCount((c) => c + 1);
      if (res.current_phase) setCurrentPhase(res.current_phase);
      if (res.gaps && res.gaps.length > 0) setGaps(res.gaps);
      if (res.gap_addressed) setCurrentGap(res.gap_addressed);
      if (res.is_session_complete) {
        setIsSessionComplete(true);
        setStatus("idle");
        return;
      }

      // Play the response via sentence-level TTS
      await playElevenLabs(res.interviewer_response);
    } catch {
      setError("Failed to get response. Please try again.");
      if (activeRef.current) startListening();
    }
  }, [sessionId, playElevenLabs]);

  // ── Start listening (SpeechRecognition) ────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const startListening = useCallback(() => {
    if (!activeRef.current) return;
    setStatus("listening");
    setTranscript("");
    speechStartRef.current = Date.now();
    playbackCancelRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!SR) {
      setError("Speech recognition requires Chrome or Edge.");
      return;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    recognitionRef.current = rec;

    let finalText = "";

    rec.onresult = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript + " ";
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      setTranscript(finalText + interim);
    };

    rec.onend = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      const text = finalText.trim();
      if (text.length > 2 && activeRef.current) {
        sendToAgent(text);
      } else if (activeRef.current) {
        startListening();
      }
    };

    rec.onerror = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (e.error !== "aborted" && e.error !== "no-speech") {
        setError(`Speech error: ${e.error}`);
      }
      if (activeRef.current && statusRef.current === "listening") {
        setTimeout(() => startListening(), 500);
      }
    };

    rec.start();
  }, [sendToAgent]);

  // ── Public start/stop ──────────────────────────────────────────────────

  const start = useCallback(async () => {
    setError(null);
    activeRef.current = true;
    await startAnalyser();
    startListening();
  }, [startAnalyser, startListening]);

  const stop = useCallback(() => {
    activeRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    stopPlayback();
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setStatus("idle");
    setLevel(0);
    setTranscript("");
  }, [stopPlayback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeRef.current = false;
      recognitionRef.current?.stop();
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  return {
    status,
    level,
    transcript,
    latestAgentText,
    guardrailActivated,
    currentPhase,
    isSessionComplete,
    error,
    gaps,
    currentGap,
    guardrailCount,
    start,
    stop,
  };
}
