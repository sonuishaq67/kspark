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
      text: "text-rose-200",
      track: "bg-rose-500/15",
      fill: "bg-gradient-to-r from-rose-400 to-rose-300",
      glow: "from-rose-500/20",
      badge: "bg-rose-500/15 text-rose-200 border-rose-400/30",
    };
  }
  if (score <= 7) {
    return {
      text: "text-amber-200",
      track: "bg-amber-500/15",
      fill: "bg-gradient-to-r from-amber-400 to-amber-300",
      glow: "from-amber-500/20",
      badge: "bg-amber-500/15 text-amber-200 border-amber-400/30",
    };
  }
  return {
    text: "text-emerald-200",
    track: "bg-emerald-500/15",
    fill: "bg-gradient-to-r from-emerald-400 to-teal-300",
    glow: "from-emerald-500/20",
    badge: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
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
    <article className="relative overflow-hidden rounded-3xl glass p-6 glass-hover">
      <div className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${tone.glow} to-transparent blur-3xl`} />
      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">
              Score dimension
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">{label}</h3>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone.badge}`}>
            {score}/10
          </span>
        </div>

        <div className="mb-4 flex items-end gap-3">
          <span className={`text-5xl font-bold leading-none ${tone.text}`}>{score}</span>
          <span className="pb-1 text-sm text-gray-500">out of 10</span>
        </div>

        <div className={`mb-4 h-2 overflow-hidden rounded-full ${tone.track}`}>
          <div
            className={`h-full rounded-full ${tone.fill} shadow-[0_0_8px_currentColor]`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="text-sm leading-6 text-gray-300">
          {justification || "Score reflects the overall signal observed across the session."}
        </p>
      </div>
    </article>
  );
}
