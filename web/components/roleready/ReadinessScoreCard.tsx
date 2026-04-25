interface ReadinessScoreCardProps {
  score: number;
}

export default function ReadinessScoreCard({ score }: ReadinessScoreCardProps) {
  // Determine color and label based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return { color: "emerald", label: "Exceptional Fit" };
    if (score >= 75) return { color: "green", label: "Strong Fit" };
    if (score >= 60) return { color: "yellow", label: "Good Fit" };
    if (score >= 40) return { color: "orange", label: "Moderate Fit" };
    return { color: "red", label: "Needs Preparation" };
  };

  const { color, label } = getScoreColor(score);

  // Calculate circle progress
  const circumference = 2 * Math.PI * 70; // radius = 70
  const progress = (score / 100) * circumference;

  return (
    <section className="rounded-3xl glass p-8">
      <h2 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
        Overall Readiness
      </h2>

      <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
        {/* Circular Progress */}
        <div className="relative flex shrink-0 items-center justify-center">
          <svg className="h-48 w-48 -rotate-90 transform">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-white/10"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out ${
                color === "emerald"
                  ? "text-emerald-400"
                  : color === "green"
                    ? "text-green-400"
                    : color === "yellow"
                      ? "text-yellow-400"
                      : color === "orange"
                        ? "text-orange-400"
                        : "text-rose-400"
              }`}
              style={{
                filter: "drop-shadow(0 0 8px currentColor)",
              }}
            />
          </svg>

          {/* Score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-white">{score}</span>
            <span className="text-sm font-medium text-gray-400">/ 100</span>
          </div>
        </div>

        {/* Score interpretation */}
        <div className="flex-1 space-y-4">
          <div>
            <div
              className={`mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                color === "emerald"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : color === "green"
                    ? "bg-green-500/20 text-green-300"
                    : color === "yellow"
                      ? "bg-yellow-500/20 text-yellow-300"
                      : color === "orange"
                        ? "bg-orange-500/20 text-orange-300"
                        : "bg-rose-500/20 text-rose-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  color === "emerald"
                    ? "bg-emerald-400"
                    : color === "green"
                      ? "bg-green-400"
                      : color === "yellow"
                        ? "bg-yellow-400"
                        : color === "orange"
                          ? "bg-orange-400"
                          : "bg-rose-400"
                }`}
              />
              {label}
            </div>
            <h3 className="text-2xl font-bold text-white">
              {score >= 75
                ? "You're well-prepared!"
                : score >= 60
                  ? "You're on the right track"
                  : "Focus on key gaps"}
            </h3>
          </div>

          <div className="space-y-3 text-sm text-gray-300">
            {score >= 90 && (
              <p>
                Exceptional match! You exceed most requirements. Focus on
                showcasing your unique strengths and leadership experience.
              </p>
            )}
            {score >= 75 && score < 90 && (
              <p>
                Strong candidate profile. You meet all core requirements with
                some gaps in preferred skills. The interview will validate your
                depth.
              </p>
            )}
            {score >= 60 && score < 75 && (
              <p>
                Good foundation with room for improvement. You meet most
                requirements but need preparation in key areas highlighted below.
              </p>
            )}
            {score >= 40 && score < 60 && (
              <p>
                Moderate fit with significant gaps in core requirements. Focus
                your preparation on the missing skills and be ready to discuss
                how you&apos;ll bridge these gaps.
              </p>
            )}
            {score < 40 && (
              <p>
                Major gaps across multiple core areas. Consider whether this role
                aligns with your current experience level, or prepare extensively
                to address the missing requirements.
              </p>
            )}
          </div>

          {/* Score breakdown */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-center">
              <p className="text-xs font-medium text-emerald-300">Strong</p>
              <p className="mt-1 text-2xl font-bold text-emerald-200">
                {score >= 75 ? "✓" : score >= 60 ? "~" : "✗"}
              </p>
            </div>
            <div className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-3 text-center">
              <p className="text-xs font-medium text-yellow-300">Partial</p>
              <p className="mt-1 text-2xl font-bold text-yellow-200">
                {score >= 60 ? "✓" : score >= 40 ? "~" : "✗"}
              </p>
            </div>
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-center">
              <p className="text-xs font-medium text-rose-300">Missing</p>
              <p className="mt-1 text-2xl font-bold text-rose-200">
                {score >= 75 ? "✓" : score >= 40 ? "~" : "✗"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
