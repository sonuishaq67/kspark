"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WS_URL } from "./api";
import { AICoreReport, CodeReview, ConversationTurn } from "./types";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";
export type ReviewStatus = "idle" | "reviewing" | "ready" | "error";

export interface InterviewSocketState {
  ws: WebSocket | null;
  status: ConnectionStatus;
  isConnected: boolean;

  conversation: ConversationTurn[];
  streamingText: string;
  currentPhase: string | null;
  currentPhaseIndex: number;
  totalPhases: number;
  timeRemaining: number;
  isComplete: boolean;
  guardrailActivated: boolean;
  codeReview: CodeReview | null;
  reviewStatus: ReviewStatus;

  report: AICoreReport | null;
  isThinking: boolean;
  isSpeaking: boolean;

  sendTranscriptChunk: (text: string) => void;
  sendSpeechStarted: () => void;
  sendSpeechEnded: (finalTranscript: string) => void;
  sendCodeUpdate: (code: string, language: string) => void;
  sendEndSession: () => void;
  disconnect: () => void;
}

export function useInterviewSocket(sessionId: string): InterviewSocketState {
  const wsRef = useRef<WebSocket | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [totalPhases, setTotalPhases] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [guardrailActivated] = useState(false);
  const [codeReview, setCodeReview] = useState<CodeReview | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("idle");
  const [report, setReport] = useState<AICoreReport | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const streamBufferRef = useRef("");
  const audioChunksRef = useRef<string[]>([]);

  const playAudio = useCallback(async (b64Chunks: string[]) => {
    if (b64Chunks.length === 0) return;
    setIsSpeaking(true);

    try {
      const allBytes: number[] = [];
      for (const b64 of b64Chunks) {
        if (!b64) continue;
        const binary = atob(b64);
        for (let i = 0; i < binary.length; i++) {
          allBytes.push(binary.charCodeAt(i));
        }
      }

      if (allBytes.length === 0) {
        setIsSpeaking(false);
        return;
      }

      const blob = new Blob([new Uint8Array(allBytes)], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      await new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.play().catch(() => resolve());
      });
    } catch {
      // Audio playback is best-effort.
    }

    setIsSpeaking(false);
  }, []);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const connect = useCallback(() => {
    if (!sessionId) return;
    const socket = new WebSocket(`${WS_URL}/sessions/${sessionId}/stream`);
    wsRef.current = socket;
    setWs(socket);
    setStatus("connecting");

    socket.onopen = () => setStatus("connected");

    socket.onmessage = (e) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(e.data as string);
      } catch {
        return;
      }

      switch (data.type) {
        case "interviewer_text_delta": {
          const delta = data.delta as string;
          const isFinal = data.is_final as boolean;
          if (!isFinal && delta) {
            streamBufferRef.current += delta;
            setStreamingText(streamBufferRef.current);
            // First real token has arrived — kill the thinking indicator now,
            // not on selected_question (which leaves a dead gap in the UI).
            setIsThinking(false);
          } else if (isFinal) {
            const full = streamBufferRef.current;
            if (full.trim()) {
              setConversation((prev) => [...prev, { speaker: "interviewer", text: full }]);
            }
            streamBufferRef.current = "";
            setStreamingText("");
          }
          break;
        }

        case "interviewer_audio_chunk": {
          // Buffer everything; playback happens on interviewer_audio_complete.
          const chunk = data.data as string;
          if (chunk) audioChunksRef.current.push(chunk);
          break;
        }

        case "interviewer_audio_complete": {
          if (audioChunksRef.current.length > 0) {
            const chunks = audioChunksRef.current;
            audioChunksRef.current = [];
            playAudio(chunks);
          }
          break;
        }

        case "phase_update": {
          setCurrentPhase(data.phase as string);
          setCurrentPhaseIndex(data.phase_index as number);
          setTotalPhases(data.total_phases as number);
          break;
        }

        case "timer_update": {
          setTimeRemaining(data.time_remaining_seconds as number);
          break;
        }

        case "report_ready": {
          setReport(data.report as AICoreReport);
          setIsComplete(true);
          break;
        }

        case "selected_question": {
          // Keep isThinking=true here. The candidate should see "thinking…"
          // until the very first text token actually arrives.
          break;
        }

        case "code_review": {
          setCodeReview(data.review as CodeReview);
          setReviewStatus("ready");
          break;
        }

        case "error": {
          console.error("WS error from server:", data.code, data.message);
          setReviewStatus("error");
          break;
        }
      }
    };

    socket.onclose = () => {
      setStatus("disconnected");
      wsRef.current = null;
      setWs(null);
    };
    socket.onerror = () => setStatus("error");
  }, [sessionId, playAudio]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const sendTranscriptChunk = useCallback(
    (text: string) => {
      send({ type: "transcript_chunk", text, is_final: false });
    },
    [send]
  );

  const sendSpeechStarted = useCallback(() => {
    setIsThinking(false);
    send({ type: "speech_started" });
  }, [send]);

  const sendSpeechEnded = useCallback(
    (finalTranscript: string) => {
      if (finalTranscript.trim()) {
        setConversation((prev) => [
          ...prev,
          { speaker: "candidate", text: finalTranscript },
        ]);
      }
      setIsThinking(true);
      send({ type: "speech_ended", final_transcript: finalTranscript });
    },
    [send]
  );

  const sendCodeUpdate = useCallback(
    (code: string, language: string) => {
      setReviewStatus(code.trim() ? "reviewing" : "idle");
      send({ type: "code_update", code, language });
    },
    [send]
  );

  const sendEndSession = useCallback(() => {
    send({ type: "end_session" });
  }, [send]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setWs(null);
    setStatus("disconnected");
  }, []);

  return {
    ws,
    status,
    isConnected: status === "connected",
    conversation,
    streamingText,
    currentPhase,
    currentPhaseIndex,
    totalPhases,
    timeRemaining,
    isComplete,
    guardrailActivated,
    codeReview,
    reviewStatus,
    report,
    isThinking,
    isSpeaking,
    sendTranscriptChunk,
    sendSpeechStarted,
    sendSpeechEnded,
    sendCodeUpdate,
    sendEndSession,
    disconnect,
  };
}
