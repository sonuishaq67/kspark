"use client";

import { GapTrackingItem } from "@/lib/types";

interface LiveGapPanelProps {
  gaps: GapTrackingItem[];
  currentGap: string | null;
  guardrailCount: number;
}

const statusConfig = {
  open: {
    dot: "bg-rose-600",
    card: "border-rose-200 bg-rose-50",
    text: "text-rose-800",
    label: "Open",
  },
  improved: {
    dot: "bg-amber-500",
    card: "border-amber-200 bg-amber-50",
    text: "text-amber-800",
    label: "Improved",
  },
  closed: {
    dot: "bg-emerald-600",
    card: "border-emerald-200 bg-emerald-50",
    text: "text-emerald-800",
    label: "Closed",
  },
};

const categoryLabel = {
  missing: "Missing",
  partial: "Partial",
  strong: "Strong",
};

export default function LiveGapPanel({ gaps, currentGap, guardrailCount }: LiveGapPanelProps) {
  if (gaps.length === 0) return null;

  const openCount = gaps.filter((gap) => gap.status === "open").length;
  const improvedCount = gaps.filter((gap) => gap.status === "improved").length;
  const closedCount = gaps.filter((gap) => gap.status === "closed").length;
  const progress = Math.round(((closedCount + improvedCount * 0.5) / gaps.length) * 100);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#667169]">
          Gap Tracker
        </h3>
        <span className="text-xs font-semibold text-[#17211b]">{progress}%</span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-[#17211b]/10">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
        <span className="text-rose-700">{openCount} open</span>
        <span className="text-amber-700">{improvedCount} improved</span>
        <span className="text-emerald-700">{closedCount} closed</span>
      </div>

      <div className="flex flex-col gap-2">
        {gaps.map((gap) => {
          const cfg = statusConfig[gap.status];
          const isActive = currentGap === gap.label;

          return (
            <div
              key={`${gap.category}-${gap.label}`}
              className={`rounded-lg border px-3 py-2 transition ${cfg.card} ${
                isActive ? "ring-2 ring-[#17211b]/20" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#17211b]">{gap.label}</p>
                  <p className={`mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${cfg.text}`}>
                    {categoryLabel[gap.category]} - {cfg.label}
                  </p>
                  {gap.evidence && (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#536058]">
                      {gap.evidence}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {guardrailCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-amber-100 text-xs font-bold text-amber-800">
            !
          </span>
          <p className="text-[10px] font-semibold text-amber-800">
            {guardrailCount} ghostwriting {guardrailCount === 1 ? "attempt" : "attempts"} blocked
          </p>
        </div>
      )}
    </div>
  );
}
