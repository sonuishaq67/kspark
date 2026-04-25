import { ConversationTurn } from "@/lib/types";

interface TranscriptBubbleProps {
  turn: ConversationTurn;
}

export default function TranscriptBubble({ turn }: TranscriptBubbleProps) {
  const isCandidate = turn.speaker === "candidate";

  return (
    <div className={`flex ${isCandidate ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[82%] rounded-lg px-4 py-3 text-sm leading-relaxed shadow-sm
          ${
            isCandidate
              ? "rounded-br-sm bg-[#17211b] text-white"
              : "rounded-bl-sm border border-[#17211b]/10 bg-white text-[#17211b]"
          }
        `}
      >
        {!isCandidate && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
            Interviewer
          </p>
        )}
        <p className="whitespace-pre-wrap">{turn.text}</p>
        {turn.guardrail && (
          <p className="mt-2 text-xs font-medium text-amber-700">
            Coaching mode: answer in your own words
          </p>
        )}
      </div>
    </div>
  );
}
