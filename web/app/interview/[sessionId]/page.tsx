"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/components/shared/Layout";
import MicButton from "@/components/p2/MicButton";
import TranscriptPanel from "@/components/p2/TranscriptPanel";
import QuestionCard from "@/components/p2/QuestionCard";
import { useInterviewSocket } from "@/lib/useInterviewSocket";
import { api, Question } from "@/lib/api";

export default function InterviewPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [ending, setEnding] = useState(false);

  const {
    transcript,
    conversation,
    sessionState,
    currentQuestionIndex,
    isAgentSpeaking,
    isRecording,
    isConnected,
    startRecording,
    stopRecording,
    disconnect,
  } = useInterviewSocket(sessionId);

  // Load questions for the question card
  useEffect(() => {
    api.listQuestions().then(setQuestions).catch(console.error);
  }, []);

  // Auto-navigate to report when session closes
  useEffect(() => {
    if (sessionState === "ENDED") {
      router.push(`/report/${sessionId}`);
    }
  }, [sessionState, sessionId, router]);

  const handleEndSession = async () => {
    if (ending) return;
    setEnding(true);
    stopRecording();
    disconnect();
    try {
      await api.endSession(sessionId);
    } catch {
      // ignore — navigate anyway
    }
    router.push(`/report/${sessionId}`);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isThinking = sessionState === "THINKING";
  const isClosing = sessionState === "CLOSING";

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
        {/* Question card */}
        {currentQuestion && (
          <QuestionCard
            questionText={currentQuestion.text}
            currentIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            topic={currentQuestion.topic}
          />
        )}

        {/* Status bar */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-gray-600"
            }`}
          />
          <span>{isConnected ? "Connected" : "Connecting..."}</span>
          {isAgentSpeaking && (
            <span className="text-indigo-400 animate-pulse">● AI speaking</span>
          )}
          {isThinking && (
            <span className="text-yellow-400 animate-pulse">● Thinking...</span>
          )}
          {isClosing && (
            <span className="text-green-400">All questions complete</span>
          )}
        </div>

        {/* Transcript panel */}
        <div className="flex-1 overflow-hidden bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <TranscriptPanel
            conversation={conversation}
            liveTranscript={transcript}
            isThinking={isThinking}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-4">
            <MicButton
              isRecording={isRecording}
              isConnected={isConnected}
              onStart={startRecording}
              onStop={stopRecording}
            />
            <div className="text-sm text-gray-400">
              {isRecording ? (
                <span className="text-red-400">Recording — click to stop</span>
              ) : (
                <span>Click mic to speak</span>
              )}
            </div>
          </div>

          <button
            onClick={handleEndSession}
            disabled={ending}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 border border-gray-700 hover:border-red-700/50 px-4 py-2 rounded-lg"
          >
            {ending ? "Ending..." : "End Session"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
