import { GapReportItem } from "@/lib/types";

interface GapProgressSectionProps {
  gaps: GapReportItem[];
  title?: string;
  description?: string;
}

function gapStatusColor(status: GapReportItem["status"]) {
  switch (status) {
    case "closed":
      return {
        border: "border-emerald-700/40",
        bg: "bg-emerald-950/30",
        text: "text-emerald-200",
        badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
        icon: "✓",
      };
    case "improved":
      return {
        border: "border-amber-700/40",
        bg: "bg-amber-950/30",
        text: "text-amber-200",
        badge: "bg-amber-500/20 text-amber-300 border-amber-400/40",
        icon: "↗",
      };
    case "open":
    default:
      return {
        border: "border-rose-700/40",
        bg: "bg-rose-950/30",
        text: "text-rose-200",
        badge: "bg-rose-500/20 text-rose-300 border-rose-400/40",
        icon: "○",
      };
  }
}

function gapStatusLabel(status: GapReportItem["status"]) {
  switch (status) {
    case "closed":
      return "Addressed";
    case "improved":
      return "Improved";
    case "open":
    default:
      return "Needs Work";
  }
}

export default function GapProgressSection({
  gaps,
  title = "Gap Analysis",
  description = "Areas identified during the interview that need attention",
}: GapProgressSectionProps) {
  if (!gaps || gaps.length === 0) {
    return (
      <section className="rounded-3xl glass p-6">
        <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
        <p className="mt-3 text-sm italic text-gray-400">
          No gaps were identified during this interview.
        </p>
      </section>
    );
  }

  const openGaps = gaps.filter((g) => g.status === "open");
  const improvedGaps = gaps.filter((g) => g.status === "improved");
  const closedGaps = gaps.filter((g) => g.status === "closed");

  return (
    <section className="rounded-3xl glass p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
        <p className="mt-2 text-sm text-gray-400">{description}</p>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-rose-700/30 bg-rose-950/20 p-4 text-center">
          <div className="text-2xl font-bold text-rose-200">{openGaps.length}</div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wider text-rose-300/80">
            Needs Work
          </div>
        </div>
        <div className="rounded-2xl border border-amber-700/30 bg-amber-950/20 p-4 text-center">
          <div className="text-2xl font-bold text-amber-200">{improvedGaps.length}</div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wider text-amber-300/80">
            Improved
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-700/30 bg-emerald-950/20 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-200">{closedGaps.length}</div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wider text-emerald-300/80">
            Addressed
          </div>
        </div>
      </div>

      {/* Gap List */}
      <div className="space-y-3">
        {gaps.map((gap, index) => {
          const colors = gapStatusColor(gap.status);
          return (
            <article
              key={`${gap.label}-${index}`}
              className={`rounded-2xl border p-4 transition-all hover:shadow-lg ${colors.border} ${colors.bg}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${colors.badge} text-sm font-bold`}
                    aria-label={gapStatusLabel(gap.status)}
                  >
                    {colors.icon}
                  </span>
                  <div className="flex-1">
                    <h3 className={`text-sm font-semibold ${colors.text}`}>{gap.label}</h3>
                    {gap.evidence && (
                      <p className="mt-2 text-sm leading-6 text-current/90">{gap.evidence}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${colors.badge}`}
                >
                  {gapStatusLabel(gap.status)}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* Coaching Note */}
      {openGaps.length > 0 && (
        <div className="mt-6 rounded-2xl border border-indigo-700/30 bg-indigo-950/20 p-4">
          <div className="flex gap-3">
            <span className="text-lg" aria-hidden="true">
              💡
            </span>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-indigo-200">Coaching Tip</h4>
              <p className="mt-1 text-sm leading-6 text-indigo-300/90">
                Focus on the &ldquo;Needs Work&rdquo; gaps in your next practice session. These are the areas
                where you can make the biggest improvement. Check the Next Practice Plan below for
                specific drills.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
