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
    return <p className="text-sm italic text-[#667169]">No question data available.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {threadSummary.map((item) => (
        <article key={item.question_id} className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="flex-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
                {topicLabel[item.topic] ?? item.topic}
              </span>
              <p className="mt-2 font-medium leading-6 text-[#17211b]">{item.question_text}</p>
            </div>
            <span
              className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                item.status === "closed"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {item.status === "closed" ? "Complete" : "Incomplete"}
            </span>
          </div>

          <div className="mb-3 flex flex-wrap gap-4 text-xs text-[#667169]">
            <span>
              <span className="font-semibold text-[#17211b]">{item.gaps_probed}</span> probe{item.gaps_probed !== 1 ? "s" : ""}
            </span>
            <span>
              <span className="font-semibold text-[#17211b]">{item.gaps_closed.length}</span> closed
            </span>
            <span>
              <span className="font-semibold text-[#17211b]">{item.gaps_open.length}</span> open
            </span>
          </div>

          {item.gaps_closed.length > 0 && (
            <div className="mb-2">
              <p className="mb-1.5 text-xs text-[#667169]">Covered</p>
              <div className="flex flex-wrap gap-1.5">
                {item.gaps_closed.map((gap) => (
                  <span key={gap} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.gaps_open.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs text-[#667169]">Missed</p>
              <div className="flex flex-wrap gap-1.5">
                {item.gaps_open.map((gap) => (
                  <span key={gap} className="rounded-lg border border-[#17211b]/10 bg-white px-2.5 py-1 text-xs text-[#536058]">
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
