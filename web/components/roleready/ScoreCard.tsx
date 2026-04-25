const DIMENSION_LABELS: Record<string, string> = {
  role_alignment: "Role Alignment",
  technical_clarity: "Technical Clarity",
  communication: "Communication",
  evidence_strength: "Evidence Strength",
  followup_recovery: "Follow-up Recovery",
};

interface ScoreCardProps {
  dimension: string;
  score: number;
  justification?: string;
}

function scoreTone(score: number) {
  if (score <= 4) return { text: "text-rose-700", fill: "bg-rose-600", bg: "bg-rose-50" };
  if (score <= 7) return { text: "text-amber-700", fill: "bg-amber-500", bg: "bg-amber-50" };
  return { text: "text-emerald-700", fill: "bg-emerald-600", bg: "bg-emerald-50" };
}

export default function ScoreCard({ dimension, score, justification }: ScoreCardProps) {
  const label = DIMENSION_LABELS[dimension] ?? dimension;
  const tone = scoreTone(score);
  const percentage = Math.max(0, Math.min(100, score * 10));

  return (
    <article className={`rounded-lg border border-[#17211b]/10 p-5 shadow-sm ${tone.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
            Score dimension
          </p>
          <h3 className="mt-2 text-base font-semibold text-[#17211b]">{label}</h3>
        </div>
        <span className={`rounded-lg bg-white px-2.5 py-1 text-xs font-semibold ${tone.text}`}>
          {score}/10
        </span>
      </div>

      <div className="mt-5 flex items-end gap-2">
        <span className={`text-5xl font-semibold leading-none ${tone.text}`}>{score}</span>
        <span className="pb-1 text-sm text-[#667169]">out of 10</span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
        <div className={`h-full rounded-full ${tone.fill}`} style={{ width: `${percentage}%` }} />
      </div>

      <p className="mt-4 text-sm leading-6 text-[#45514a]">
        {justification || "Score reflects the overall signal observed across the session."}
      </p>
    </article>
  );
}
