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
        <p className="mt-8 text-center text-sm italic text-[#667169]">
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
              max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed
              ${
                turn.speaker === "candidate"
                  ? "rounded-br-sm bg-[#17211b] text-white"
                  : "rounded-bl-sm border border-[#17211b]/10 bg-white text-[#17211b]"
              }
            `}
          >
            {turn.speaker === "agent" && (
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
                Interviewer
              </p>
            )}
            <p className="whitespace-pre-wrap">{turn.text}</p>
          </div>
        </div>
      ))}

      {/* Live transcript (current candidate turn) */}
      {liveTranscript && (
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-lg rounded-br-sm border border-[#17211b]/15 bg-[#e7efe9] px-4 py-2.5 text-sm text-[#17211b]">
            <p className="whitespace-pre-wrap">{liveTranscript}</p>
          </div>
        </div>
      )}

      {/* Thinking indicator */}
      {isThinking && (
        <div className="flex justify-start">
          <div className="rounded-lg rounded-bl-sm border border-[#17211b]/10 bg-white px-4 py-3">
            <div className="flex gap-1 items-center">
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#667169] [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#667169] [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#667169]" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
