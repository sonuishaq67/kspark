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
  const [currentQuestionIndex] = useState(0);

  const {
    liveTranscript,
    conversation,
    isComplete,
    currentPhase,
    isThinking,
    isConnected,
    sendSpeechStarted,
    sendSpeechEnded,
    disconnect,
    status,
  } = useInterviewSocket(sessionId);

  // Track recording state locally (browser mic)
  const [isRecording, setIsRecording] = useState(false);

  // Load questions for the question card
  useEffect(() => {
    api.listQuestions().then(setQuestions).catch(console.error);
  }, []);

  // Auto-navigate to report when session ends
  useEffect(() => {
    if (isComplete) {
      router.push(`/report/${sessionId}`);
    }
  }, [isComplete, sessionId, router]);

  const handleStartRecording = () => {
    setIsRecording(true);
    sendSpeechStarted();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // In text-only mode, use liveTranscript as final
    if (liveTranscript.trim()) {
      sendSpeechEnded(liveTranscript.trim());
    }
  };

  const handleEndSession = async () => {
    if (ending) return;
    setEnding(true);
    disconnect();
    try {
      await api.endSession(sessionId);
    } catch {
      // ignore
    }
    router.push(`/report/${sessionId}`);
  };

  const currentQuestion = questions[currentQuestionIndex];

  // Map new ConversationTurn to the format TranscriptPanel expects
  const legacyConversation = conversation.map((t) => ({
    speaker: t.speaker === "interviewer" ? ("agent" as const) : ("candidate" as const),
    text: t.text,
  }));

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
        {currentQuestion && (
          <QuestionCard
            questionText={currentQuestion.text}
            currentIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            topic={currentQuestion.topic}
          />
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-600"}`} />
          <span>{isConnected ? "Connected" : status === "connecting" ? "Connecting..." : "Disconnected"}</span>
          {isThinking && <span className="text-yellow-400 animate-pulse">● Thinking...</span>}
          {currentPhase && <span className="text-indigo-400">{currentPhase.replace(/_/g, " ")}</span>}
        </div>

        <div className="flex-1 overflow-hidden bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <TranscriptPanel
            conversation={legacyConversation}
            liveTranscript={liveTranscript}
            isThinking={isThinking}
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-4">
            <MicButton
              isRecording={isRecording}
              isConnected={isConnected}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
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
