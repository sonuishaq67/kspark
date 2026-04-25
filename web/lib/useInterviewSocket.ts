"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WS_URL } from "./api";
import { AICoreReport, ConversationTurn } from "./types";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

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
  report: AICoreReport | null;
  isThinking: boolean;
  isSpeaking: boolean;   // agent is currently playing TTS audio

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
  const [report, setReport] = useState<AICoreReport | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const streamBufferRef = useRef("");

  // Audio playback — accumulate chunks then play as single blob
  const audioChunksRef = useRef<string[]>([]);
  const audioCompleteRef = useRef(false);

  const playAudio = useCallback(async (b64Chunks: string[]) => {
    if (b64Chunks.length === 0) return;
    setIsSpeaking(true);

    try {
      // Concatenate all base64 chunks into one binary blob
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
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        audio.play().catch(() => resolve());
      });
    } catch {
      // skip
    }

    setIsSpeaking(false);
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
      try { data = JSON.parse(e.data as string); } catch { return; }

      switch (data.type) {
        case "interviewer_text_delta": {
          const delta = data.delta as string;
          const isFinal = data.is_final as boolean;
          if (!isFinal && delta) {
            streamBufferRef.current += delta;
            setStreamingText(streamBufferRef.current);
            setIsThinking(false);
          } else if (isFinal) {
            const full = streamBufferRef.current;
            if (full.trim()) {
              setConversation((prev) => [...prev, { speaker: "interviewer", text: full }]);
            }
            streamBufferRef.current = "";
            setStreamingText("");

            // Text done — wait a beat then play accumulated audio
            setTimeout(() => {
              if (audioChunksRef.current.length > 0) {
                const chunks = [...audioChunksRef.current];
                audioChunksRef.current = [];
                playAudio(chunks);
              } else {
                // Audio hasn't arrived yet — mark that text is done
                audioCompleteRef.current = true;
              }
            }, 100);
          }
          break;
        }
        case "interviewer_audio_chunk": {
          // Accumulate audio chunks — play when text is_final
          audioChunksRef.current.push(data.data as string);
          // If text streaming already finished, play immediately
          if (audioCompleteRef.current) {
            const chunks = [...audioChunksRef.current];
            audioChunksRef.current = [];
            audioCompleteRef.current = false;
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
          setIsThinking(false);
          break;
        }
      }
    };

    socket.onclose = () => { setStatus("disconnected"); wsRef.current = null; setWs(null); };
    socket.onerror = () => setStatus("error");
  }, [sessionId, playAudio]);

  useEffect(() => {
    connect();
    return () => { wsRef.current?.close(); };
  }, [connect]);

  const sendEndSession = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "end_session" }));
  }, []);

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
    report,
    isThinking,
    isSpeaking,
    sendEndSession,
    disconnect,
  };
}
