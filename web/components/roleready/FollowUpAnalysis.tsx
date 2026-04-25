import { FollowUpAnalysisItem } from "@/lib/types";

interface FollowUpAnalysisProps {
  items: FollowUpAnalysisItem[];
}

function qualityTone(value: FollowUpAnalysisItem["candidate_response_quality"]) {
  if (value === "strong") {
    return "bg-green-900/40 text-green-300 border-green-700/50";
  }
  if (value === "weak") {
    return "bg-red-900/40 text-red-300 border-red-700/50";
  }
  return "bg-amber-900/40 text-amber-300 border-amber-700/50";
}

export default function FollowUpAnalysis({ items }: FollowUpAnalysisProps) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5">
        <h2 className="text-lg font-semibold text-gray-100">Why the AI asked follow-ups</h2>
        <p className="mt-3 text-sm italic text-gray-400">
          No follow-up probes were recorded for this session.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-100">Why the AI asked follow-ups</h2>
        <p className="mt-2 text-sm text-gray-400">
          Each probe highlights where the interviewer needed more depth, specificity, or recovery.
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <article
            key={`${item.question}-${index}`}
            className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5"
          >
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                  Follow-up {index + 1}
                </p>
                <h3 className="mt-2 text-base font-medium leading-7 text-gray-100">
                  {item.question}
                </h3>
              </div>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${qualityTone(
                  item.candidate_response_quality
                )}`}
              >
                {item.candidate_response_quality}
              </span>
            </div>

            <p className="text-sm leading-6 text-gray-300">{item.reason}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
