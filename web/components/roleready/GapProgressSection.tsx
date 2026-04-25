import { GapReportItem } from "@/lib/types";

interface GapProgressSectionProps {
  gaps: GapReportItem[];
  title?: string;
  description?: string;
}

function gapStatusStyle(status: GapReportItem["status"]) {
  switch (status) {
    case "closed":
      return {
        card: "border-emerald-200 bg-emerald-50 text-emerald-900",
        label: "Addressed",
      };
    case "improved":
      return {
        card: "border-amber-200 bg-amber-50 text-amber-900",
        label: "Improved",
      };
    case "open":
    default:
      return {
        card: "border-rose-200 bg-rose-50 text-rose-900",
        label: "Needs work",
      };
  }
}

export default function GapProgressSection({
  gaps,
  title = "Gap Analysis",
  description = "Areas identified during the interview that need attention",
}: GapProgressSectionProps) {
  if (!gaps || gaps.length === 0) {
    return (
      <section className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#17211b]">{title}</h2>
        <p className="mt-3 text-sm italic text-[#667169]">
          No gaps were identified during this interview.
        </p>
      </section>
    );
  }

  const openGaps = gaps.filter((gap) => gap.status === "open");
  const improvedGaps = gaps.filter((gap) => gap.status === "improved");
  const closedGaps = gaps.filter((gap) => gap.status === "closed");

  return (
    <section className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#17211b]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#536058]">{description}</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center text-rose-900">
          <div className="text-2xl font-semibold">{openGaps.length}</div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em]">Needs work</div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-amber-900">
          <div className="text-2xl font-semibold">{improvedGaps.length}</div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em]">Improved</div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center text-emerald-900">
          <div className="text-2xl font-semibold">{closedGaps.length}</div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em]">Addressed</div>
        </div>
      </div>

      <div className="space-y-3">
        {gaps.map((gap, index) => {
          const style = gapStatusStyle(gap.status);
          return (
            <article key={`${gap.label}-${index}`} className={`rounded-lg border p-4 ${style.card}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{gap.label}</h3>
                  {gap.evidence && (
                    <p className="mt-2 text-sm leading-6 opacity-80">{gap.evidence}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-lg bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                  {style.label}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {openGaps.length > 0 && (
        <div className="mt-6 rounded-lg border border-[#17211b]/10 bg-white p-4">
          <h4 className="text-sm font-semibold text-[#17211b]">Coaching note</h4>
          <p className="mt-1 text-sm leading-6 text-[#536058]">
            Focus on the needs-work gaps in your next practice session. Those are the highest leverage areas for improvement.
          </p>
        </div>
      )}
    </section>
  );
}
