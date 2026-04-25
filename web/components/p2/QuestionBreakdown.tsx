import { ThreadSummaryItem } from "@/lib/api";

interface QuestionBreakdownProps {
  threadSummary: ThreadSummaryItem[];
}

const topicLabel: Record<string, string> = {
  behavioral: "Behavioral",
  technical_concept: "Technical",
  system_design: "System Design",
};

export default function QuestionBreakdown({ threadSummary }: QuestionBreakdownProps) {
  if (!threadSummary || threadSummary.length === 0) {
    return (
      <p className="text-gray-500 text-sm italic">No question data available.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {threadSummary.map((item) => (
        <div
          key={item.question_id}
          className="bg-gray-800/60 border border-gray-700 rounded-xl p-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                {topicLabel[item.topic] ?? item.topic}
              </span>
              <p className="text-gray-100 font-medium mt-1 leading-snug">
                {item.question_text}
              </p>
            </div>
            <span
              className={`
                shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full
                ${
                  item.status === "closed"
                    ? "bg-green-900/50 text-green-400 border border-green-700/50"
                    : "bg-yellow-900/50 text-yellow-400 border border-yellow-700/50"
                }
              `}
            >
              {item.status === "closed" ? "Complete" : "Incomplete"}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex gap-4 text-xs text-gray-400 mb-3">
            <span>
              <span className="text-gray-300 font-medium">{item.gaps_probed}</span> probe
              {item.gaps_probed !== 1 ? "s" : ""}
            </span>
            <span>
              <span className="text-gray-300 font-medium">{item.gaps_closed.length}</span> gap
              {item.gaps_closed.length !== 1 ? "s" : ""} closed
            </span>
            <span>
              <span className="text-gray-300 font-medium">{item.gaps_open.length}</span> open
            </span>
          </div>

          {/* Gaps */}
          {item.gaps_closed.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-500 mb-1.5">Covered:</p>
              <div className="flex flex-wrap gap-1.5">
                {item.gaps_closed.map((g) => (
                  <span
                    key={g}
                    className="text-xs bg-green-900/30 text-green-400 border border-green-800/50 rounded-full px-2.5 py-0.5"
                  >
                    ✓ {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.gaps_open.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Missed:</p>
              <div className="flex flex-wrap gap-1.5">
                {item.gaps_open.map((g) => (
                  <span
                    key={g}
                    className="text-xs bg-gray-700/50 text-gray-400 border border-gray-600/50 rounded-full px-2.5 py-0.5"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
