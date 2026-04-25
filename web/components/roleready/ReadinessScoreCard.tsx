interface ReadinessScoreCardProps {
  score: number;
}

function scoreMeta(score: number) {
  if (score >= 90) return { label: "Exceptional fit", color: "text-emerald-700", fill: "bg-emerald-600" };
  if (score >= 75) return { label: "Strong fit", color: "text-emerald-700", fill: "bg-emerald-600" };
  if (score >= 60) return { label: "Good fit", color: "text-amber-700", fill: "bg-amber-500" };
  if (score >= 40) return { label: "Moderate fit", color: "text-amber-700", fill: "bg-amber-500" };
  return { label: "Needs preparation", color: "text-rose-700", fill: "bg-rose-600" };
}

export default function ReadinessScoreCard({ score }: ReadinessScoreCardProps) {
  const meta = scoreMeta(score);

  return (
    <section className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
      <div className="grid gap-8 md:grid-cols-[220px_1fr] md:items-center">
        <div className="rounded-lg border border-[#17211b]/10 bg-white p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
            Overall readiness
          </p>
          <p className={`mt-4 text-6xl font-semibold tracking-tight ${meta.color}`}>{score}</p>
          <p className="mt-1 text-sm text-[#667169]">out of 100</p>
        </div>

        <div>
          <div className={`inline-flex rounded-lg bg-white px-3 py-2 text-sm font-semibold ${meta.color}`}>
            {meta.label}
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#17211b]">
            {score >= 75
              ? "You have a strong base for this role."
              : score >= 60
                ? "You are close, but the gaps need focused reps."
                : "Prioritize the gaps before a full mock loop."}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#536058]">
            The score compares your resume evidence against the target role. Use the gap map below to decide what the interviewer should test first.
          </p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e7e0d4]">
            <div className={`h-full rounded-full ${meta.fill}`} style={{ width: `${score}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
