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
          max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${
            isCandidate
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700/50"
          }
        `}
      >
        {!isCandidate && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
            Interviewer
          </p>
        )}
        <p className="whitespace-pre-wrap">{turn.text}</p>
        {turn.guardrail && (
          <p className="mt-2 text-xs text-amber-300 font-medium">
            ⚠ Coaching mode — answer in your own words
          </p>
        )}
      </div>
    </div>
  );
}
