"use client";

import { useEffect, useRef } from "react";
import { ConversationTurn } from "@/lib/types";

interface TranscriptPanelProps {
  conversation: ConversationTurn[];
  liveTranscript: string;
  isThinking: boolean;
}

export default function TranscriptPanel({
  conversation,
  liveTranscript,
  isThinking,
}: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, liveTranscript, isThinking]);

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
      {conversation.length === 0 && !liveTranscript && (
        <p className="text-gray-500 text-sm italic text-center mt-8">
          The conversation will appear here once you start speaking.
        </p>
      )}

      {conversation.map((turn, i) => (
        <div
          key={i}
          className={`flex ${turn.speaker === "candidate" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`
              max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
              ${
                turn.speaker === "candidate"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-gray-800 text-gray-100 rounded-bl-sm"
              }
            `}
          >
            {turn.speaker === "agent" && (
              <p className="text-xs text-gray-400 mb-1 font-medium">Interviewer</p>
            )}
            <p className="whitespace-pre-wrap">{turn.text}</p>
          </div>
        </div>
      ))}

      {/* Live transcript (current candidate turn) */}
      {liveTranscript && (
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm bg-indigo-500/50 text-indigo-100 border border-indigo-500/30">
            <p className="whitespace-pre-wrap">{liveTranscript}</p>
          </div>
        </div>
      )}

      {/* Thinking indicator */}
      {isThinking && (
        <div className="flex justify-start">
          <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
            <div className="flex gap-1 items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
