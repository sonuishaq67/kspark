"use client";

/**
 * useMicrophone — captures mic audio and streams it to the AI Core WebSocket.
 *
 * Flow:
 *   startRecording() → MediaRecorder captures mic → sends audio_chunk events over WS
 *   stopRecording()  → sends speech_ended event → backend STT + LLM + ElevenLabs TTS
 *   onAudioChunk     → caller receives base64 MP3 chunks to play back
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface MicrophoneState {
  isRecording: boolean;
  volume: number;          // 0–1 live RMS volume for orb animation
  liveText: string;        // partial transcript echoed back from server
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  error: string | null;
}

interface UseMicrophoneOptions {
  /** Called with each base64-encoded audio_chunk event from the server */
  onServerEvent?: (event: Record<string, unknown>) => void;
  /** WebSocket instance to send audio over */
  ws: WebSocket | null;
}

export function useMicrophone({ ws, onServerEvent }: UseMicrophoneOptions): MicrophoneState {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const [liveText, setLiveText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  // Listen for transcript_chunk events echoed back from server
  useEffect(() => {
    if (!ws) return;
    const handler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data as string) as Record<string, unknown>;
        if (data.type === "transcript_chunk") {
          setLiveText((prev) => prev + " " + (data.text as string));
        }
        onServerEvent?.(data);
      } catch {
        // ignore parse errors
      }
    };
    ws.addEventListener("message", handler);
    return () => ws.removeEventListener("message", handler);
  }, [ws, onServerEvent]);

  const stopVolumeTracking = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    setVolume(0);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setLiveText("");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access denied. Please allow mic access and try again.");
      return;
    }
    streamRef.current = stream;

    // ── Volume tracking via Web Audio API ──────────────────────────────────
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length);
      setVolume(Math.min(1, rms / 80));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();

    // ── MediaRecorder → send audio_chunk over WebSocket ────────────────────
    // Use webm/opus if available, fallback to whatever the browser supports
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "";

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size === 0 || !ws || ws.readyState !== WebSocket.OPEN) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = (reader.result as string).split(",")[1];
        ws.send(JSON.stringify({ type: "audio_chunk", data: b64 }));
      };
      reader.readAsDataURL(e.data);
    };

    // Notify server that speech started
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "speech_started" }));
    }

    recorder.start(250); // send a chunk every 250ms
    setIsRecording(true);
  }, [ws]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    recorder.stop();
    recorderRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    stopVolumeTracking();
    setIsRecording(false);

    // Tell server speech ended — it will run STT + LLM + TTS
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "speech_ended", final_transcript: "" }));
    }
  }, [ws, stopVolumeTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      stopVolumeTracking();
    };
  }, [stopVolumeTracking]);

  return { isRecording, volume, liveText, startRecording, stopRecording, error };
}
