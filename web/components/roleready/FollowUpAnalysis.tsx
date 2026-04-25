import { FollowUpAnalysisItem } from "@/lib/types";

interface FollowUpAnalysisProps {
  items: FollowUpAnalysisItem[];
}

function qualityTone(value: FollowUpAnalysisItem["candidate_response_quality"]) {
  if (value === "strong") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (value === "weak") return "bg-rose-50 text-rose-800 border-rose-200";
  return "bg-amber-50 text-amber-800 border-amber-200";
}

export default function FollowUpAnalysis({ items }: FollowUpAnalysisProps) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#17211b]">Why the AI asked follow-ups</h2>
        <p className="mt-3 text-sm italic text-[#667169]">
          No follow-up probes were recorded for this session.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[#17211b]">Why the AI asked follow-ups</h2>
        <p className="mt-2 text-sm leading-6 text-[#536058]">
          Each probe highlights where the interviewer needed more depth, specificity, or recovery.
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <article key={`${item.question}-${index}`} className="rounded-lg border border-[#17211b]/10 bg-white p-5">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
                  Follow-up {index + 1}
                </p>
                <h3 className="mt-2 text-base font-medium leading-7 text-[#17211b]">
                  {item.question}
                </h3>
              </div>
              <span className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold capitalize ${qualityTone(item.candidate_response_quality)}`}>
                {item.candidate_response_quality}
              </span>
            </div>

            <p className="text-sm leading-6 text-[#536058]">{item.reason}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
