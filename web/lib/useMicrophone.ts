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

type SpeechRecognitionConstructor = new () => SpeechRecognition;

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface MicrophoneState {
  isRecording: boolean;
  volume: number;          // 0–1 live RMS volume for orb animation
  liveText: string;        // partial transcript echoed back from server
  startRecording: () => Promise<void>;
  stopRecording: () => boolean;
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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const browserTranscriptRef = useRef("");
  const liveTranscriptRef = useRef("");
  const usingBrowserTranscriptRef = useRef(false);

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

  const stopSpeechRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.stop();
    } catch {
      // Recognition may already be stopped.
    }
    recognitionRef.current = null;
  }, []);

  const startSpeechRecognition = useCallback(() => {
    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!Recognition) {
      usingBrowserTranscriptRef.current = false;
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    browserTranscriptRef.current = "";
    liveTranscriptRef.current = "";
    usingBrowserTranscriptRef.current = true;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      if (finalText.trim()) {
        browserTranscriptRef.current = `${browserTranscriptRef.current} ${finalText}`.trim();
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "transcript_chunk",
            text: finalText.trim(),
            is_final: true,
          }));
        }
      }

      const displayText = `${browserTranscriptRef.current} ${interimText}`.trim();
      liveTranscriptRef.current = displayText;
      setLiveText(displayText);
    };

    recognition.onerror = (event) => {
      usingBrowserTranscriptRef.current = false;
      setError(`Speech recognition failed: ${event.error}`);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      usingBrowserTranscriptRef.current = false;
      recognitionRef.current = null;
    }
  }, [ws]);

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
    startSpeechRecognition();

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
      if (usingBrowserTranscriptRef.current) return;
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
  }, [ws, startSpeechRecognition]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return false;

    const finalTranscript = (
      liveTranscriptRef.current ||
      browserTranscriptRef.current
    ).trim();
    const shouldSendSpeechEnded = !usingBrowserTranscriptRef.current || Boolean(finalTranscript);

    if (!finalTranscript && usingBrowserTranscriptRef.current) {
      setError("I did not catch any speech. Try speaking again, then stop.");
    }

    recorder.stop();
    recorderRef.current = null;
    stopSpeechRecognition();

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    stopVolumeTracking();
    setIsRecording(false);

    // Tell server speech ended — it will run STT + LLM + TTS
    if (ws?.readyState === WebSocket.OPEN && shouldSendSpeechEnded) {
      ws.send(JSON.stringify({
        type: "speech_ended",
        final_transcript: finalTranscript,
      }));
      return true;
    }

    if (ws?.readyState !== WebSocket.OPEN) {
      setError("Interview connection is not ready. Please refresh and try again.");
    }
    return false;
  }, [ws, stopVolumeTracking, stopSpeechRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      stopSpeechRecognition();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      stopVolumeTracking();
    };
  }, [stopVolumeTracking, stopSpeechRecognition]);

  return { isRecording, volume, liveText, startRecording, stopRecording, error };
}
