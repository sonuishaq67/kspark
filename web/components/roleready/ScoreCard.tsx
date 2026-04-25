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
  if (score <= 4) {
    return {
      text: "text-red-300",
      track: "bg-red-950/60",
      fill: "bg-red-400",
      ring: "border-red-800/60",
      badge: "bg-red-900/40 text-red-300 border-red-700/50",
    };
  }
  if (score <= 7) {
    return {
      text: "text-amber-300",
      track: "bg-amber-950/60",
      fill: "bg-amber-400",
      ring: "border-amber-800/60",
      badge: "bg-amber-900/40 text-amber-300 border-amber-700/50",
    };
  }
  return {
    text: "text-green-300",
    track: "bg-green-950/60",
    fill: "bg-green-400",
    ring: "border-green-800/60",
    badge: "bg-green-900/40 text-green-300 border-green-700/50",
  };
}

export default function ScoreCard({
  dimension,
  score,
  justification,
}: ScoreCardProps) {
  const label = DIMENSION_LABELS[dimension] ?? dimension;
  const tone = scoreTone(score);
  const percentage = Math.max(0, Math.min(100, score * 10));

  return (
    <article className={`rounded-2xl border bg-gray-900/80 p-5 ${tone.ring}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Score Dimension
          </p>
          <h3 className="mt-2 text-lg font-semibold text-gray-100">{label}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone.badge}`}>
          {score}/10
        </span>
      </div>

      <div className="mb-4 flex items-end gap-3">
        <span className={`text-4xl font-semibold leading-none ${tone.text}`}>{score}</span>
        <span className="pb-1 text-sm text-gray-500">out of 10</span>
      </div>

      <div className={`mb-4 h-2.5 overflow-hidden rounded-full ${tone.track}`}>
        <div
          className={`h-full rounded-full ${tone.fill}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-sm leading-6 text-gray-300">
        {justification || "Score reflects the overall signal observed across the session."}
      </p>
    </article>
  );
}
