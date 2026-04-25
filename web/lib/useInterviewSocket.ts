"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WS_URL } from "./api";
import { AICoreReport, ConversationTurn, ServerEvent } from "./types";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface InterviewSocketState {
  // Connection
  status: ConnectionStatus;
  isConnected: boolean;

  // Conversation
  conversation: ConversationTurn[];
  streamingText: string;       // current AI response being streamed in
  liveTranscript: string;      // candidate's live speech-to-text

  // Session state
  currentPhase: string | null;
  currentPhaseIndex: number;
  totalPhases: number;
  timeRemaining: number;
  isComplete: boolean;
  guardrailActivated: boolean;

  // Report (populated when session ends)
  report: AICoreReport | null;

  // Actions
  sendTranscriptChunk: (text: string) => void;
  sendSpeechStarted: () => void;
  sendSpeechEnded: (finalTranscript: string) => void;
  sendEndSession: () => void;
  disconnect: () => void;

  // Text-mode (no audio)
  isThinking: boolean;
}

export function useInterviewSocket(sessionId: string): InterviewSocketState {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [totalPhases, setTotalPhases] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [guardrailActivated, setGuardrailActivated] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [report, setReport] = useState<AICoreReport | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  // Accumulate streaming text across deltas
  const streamBufferRef = useRef("");

  const connect = useCallback(() => {
    if (!sessionId) return;

    const url = `${WS_URL}/sessions/${sessionId}/stream`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => {
      setStatus("connected");
    };

    ws.onmessage = (event) => {
      let data: ServerEvent;
      try {
        data = JSON.parse(event.data as string) as ServerEvent;
      } catch {
        return;
      }

      switch (data.type) {
        case "interviewer_text_delta": {
          if (!data.is_final) {
            streamBufferRef.current += data.delta;
            setStreamingText(streamBufferRef.current);
            setIsThinking(false);
          } else {
            // Streaming complete — commit to conversation
            const fullText = streamBufferRef.current;
            if (fullText.trim()) {
              setConversation((prev) => [
                ...prev,
                { speaker: "interviewer", text: fullText },
              ]);
            }
            streamBufferRef.current = "";
            setStreamingText("");
          }
          break;
        }

        case "phase_update": {
          setCurrentPhase(data.phase);
          setCurrentPhaseIndex(data.phase_index);
          setTotalPhases(data.total_phases);
          break;
        }

        case "timer_update": {
          setTimeRemaining(data.time_remaining_seconds);
          setCurrentPhase(data.current_phase);
          break;
        }

        case "report_ready": {
          setReport(data.report);
          setIsComplete(true);
          break;
        }

        case "error": {
          console.error("WS error from server:", data.code, data.message);
          break;
        }
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      wsRef.current = null;
    };

    ws.onerror = () => {
      setStatus("error");
    };
  }, [sessionId]);

  useEffect(() => {
    connect();
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const timer = reconnectTimerRef.current;
      if (timer) clearTimeout(timer);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const sendTranscriptChunk = useCallback(
    (text: string) => {
      setLiveTranscript((prev) => prev + " " + text);
      send({ type: "transcript_chunk", text, is_final: false });
    },
    [send]
  );

  const sendSpeechStarted = useCallback(() => {
    setLiveTranscript("");
    setIsThinking(false);
    send({ type: "speech_started" });
  }, [send]);

  const sendSpeechEnded = useCallback(
    (finalTranscript: string) => {
      // Add candidate turn to conversation immediately
      if (finalTranscript.trim()) {
        setConversation((prev) => [
          ...prev,
          { speaker: "candidate", text: finalTranscript },
        ]);
      }
      setLiveTranscript("");
      setIsThinking(true);
      send({ type: "speech_ended", final_transcript: finalTranscript });
    },
    [send]
  );

  const sendEndSession = useCallback(() => {
    send({ type: "end_session" });
  }, [send]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("disconnected");
  }, []);

  return {
    status,
    isConnected: status === "connected",
    conversation,
    streamingText,
    liveTranscript,
    currentPhase,
    currentPhaseIndex,
    totalPhases,
    timeRemaining,
    isComplete,
    guardrailActivated,
    report,
    sendTranscriptChunk,
    sendSpeechStarted,
    sendSpeechEnded,
    sendEndSession,
    disconnect,
    isThinking,
  };
}
