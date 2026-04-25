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
      <div className="flex h-[calc(100vh-8rem)] min-h-[38rem] flex-col gap-4">
        {currentQuestion && (
          <div className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-5 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
              {currentQuestion.topic}
            </p>
            <p className="font-medium leading-7 text-[#17211b]">{currentQuestion.text}</p>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs font-medium text-[#667169]">
          <span className={`h-2 w-2 rounded-full ${socket.isConnected ? "bg-emerald-600" : "bg-[#8b948e]"}`} />
          <span>{socket.isConnected ? "Connected" : "Connecting..."}</span>
          {socket.isThinking && <span className="animate-pulse text-amber-700">Thinking...</span>}
          {socket.isSpeaking && <span className="animate-pulse text-emerald-700">Speaking</span>}
        </div>

        {/* Transcript */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-[#17211b]/10 bg-[#f7f5ef] p-4">
          {socket.conversation.map((t, i) => (
            <div key={i} className={`flex ${t.speaker === "candidate" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-6 shadow-sm ${
                t.speaker === "candidate"
                  ? "rounded-br-sm bg-[#17211b] text-white"
                  : "rounded-bl-sm border border-[#17211b]/10 bg-white text-[#17211b]"
              }`}>{t.text}</div>
            </div>
          ))}
          {socket.streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg rounded-bl-sm border border-[#17211b]/10 bg-white px-4 py-2.5 text-sm leading-6 text-[#17211b] shadow-sm">
                {socket.streamingText}<span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-[#17211b]" />
              </div>
            </div>
          )}
          {mic.liveText && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-lg rounded-br-sm border border-[#17211b]/15 bg-[#e7efe9] px-4 py-2.5 text-sm italic text-[#17211b]">
                {mic.liveText}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between py-2">
          <button
            onClick={mic.isRecording ? mic.stopRecording : mic.startRecording}
            disabled={socket.isThinking || socket.isSpeaking}
            className={`flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition disabled:opacity-40 ${
              mic.isRecording ? "bg-rose-700 text-white hover:bg-rose-800" : "bg-[#17211b] text-white hover:bg-[#2b3a31]"
            }`}
          >
            {mic.isRecording ? "Stop" : "Speak"}
          </button>
          <button
            onClick={handleEndSession}
            disabled={ending}
            className="rounded-lg border border-[#17211b]/15 bg-white px-4 py-2 text-sm font-semibold text-[#536058] transition hover:border-rose-300 hover:text-rose-700"
          >
            {ending ? "Ending..." : "End Session"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
