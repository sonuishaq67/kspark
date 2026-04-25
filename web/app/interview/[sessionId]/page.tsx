"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/components/shared/Layout";
import { useInterviewSocket } from "@/lib/useInterviewSocket";
import { api, Question } from "@/lib/api";
import { useMicrophone } from "@/lib/useMicrophone";

export default function InterviewPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [ending, setEnding] = useState(false);
  const [currentQuestionIndex] = useState(0);

  const socket = useInterviewSocket(sessionId);
  const mic = useMicrophone({ ws: socket.ws });

  useEffect(() => {
    api.listQuestions().then(setQuestions).catch(console.error);
  }, []);

  useEffect(() => {
    if (socket.isComplete) router.push(`/report/${sessionId}`);
  }, [socket.isComplete, sessionId, router]);

  const handleEndSession = async () => {
    if (ending) return;
    setEnding(true);
    if (mic.isRecording) mic.stopRecording();
    socket.disconnect();
    try { await api.endSession(sessionId); } catch { /* ignore */ }
    router.push(`/report/${sessionId}`);
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
        {currentQuestion && (
          <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
            <p className="text-xs text-indigo-400 uppercase tracking-wider mb-2">{currentQuestion.topic}</p>
            <p className="text-gray-100 font-medium">{currentQuestion.text}</p>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className={`w-2 h-2 rounded-full ${socket.isConnected ? "bg-green-500" : "bg-gray-600"}`} />
          <span>{socket.isConnected ? "Connected" : "Connecting..."}</span>
          {socket.isThinking && <span className="text-yellow-400 animate-pulse">● Thinking...</span>}
          {socket.isSpeaking && <span className="text-indigo-400 animate-pulse">● Speaking</span>}
        </div>

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
          {socket.conversation.map((t, i) => (
            <div key={i} className={`flex ${t.speaker === "candidate" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                t.speaker === "candidate" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-100"
              }`}>{t.text}</div>
            </div>
          ))}
          {socket.streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl bg-gray-800 px-4 py-2.5 text-sm text-gray-100">
                {socket.streamingText}<span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-indigo-400" />
              </div>
            </div>
          )}
          {mic.liveText && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl bg-indigo-500/50 px-4 py-2.5 text-sm text-indigo-100 italic">
                {mic.liveText}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between py-2">
          <button
            onClick={mic.isRecording ? mic.stopRecording : mic.startRecording}
            disabled={socket.isThinking || socket.isSpeaking}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 ${
              mic.isRecording ? "bg-red-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {mic.isRecording ? "Stop" : "Speak"}
          </button>
          <button
            onClick={handleEndSession}
            disabled={ending}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors border border-gray-700 px-4 py-2 rounded-lg"
          >
            {ending ? "Ending..." : "End Session"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
