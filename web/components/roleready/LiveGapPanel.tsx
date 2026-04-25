"use client";

import { GapTrackingItem } from "@/lib/types";

interface LiveGapPanelProps {
  gaps: GapTrackingItem[];
  currentGap: string | null;
  guardrailCount: number;
}

const statusConfig = {
  open: { icon: "○", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-400/20", label: "Open" },
  improved: { icon: "◐", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-400/20", label: "Improved" },
  closed: { icon: "●", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-400/20", label: "Closed" },
};

const categoryLabel = {
  missing: "Missing",
  partial: "Partial",
  strong: "Strong",
};

export default function LiveGapPanel({ gaps, currentGap, guardrailCount }: LiveGapPanelProps) {
  if (gaps.length === 0) return null;

  const openCount = gaps.filter((g) => g.status === "open").length;
  const improvedCount = gaps.filter((g) => g.status === "improved").length;
  const closedCount = gaps.filter((g) => g.status === "closed").length;
  const progress = gaps.length > 0 ? Math.round(((closedCount + improvedCount * 0.5) / gaps.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#17211b]/10 bg-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#667169]">
          Gap Tracker
        </h3>
        <span className="text-xs font-semibold text-[#17211b]">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-[#17211b]/5">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Summary counts */}
      <div className="flex gap-3 text-[10px] font-semibold uppercase tracking-[0.15em]">
        <span className="text-rose-500">{openCount} open</span>
        <span className="text-amber-500">{improvedCount} improved</span>
        <span className="text-emerald-500">{closedCount} closed</span>
      </div>

      {/* Gap list */}
      <div className="flex flex-col gap-1.5">
        {gaps.map((gap, i) => {
          const cfg = statusConfig[gap.status];
          const isActive = currentGap === gap.label;
          return (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${cfg.border} ${cfg.bg} ${
                isActive ? "ring-1 ring-indigo-400/40 shadow-sm" : ""
              }`}
            >
              <span className={`text-sm ${cfg.color}`}>{cfg.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-[#17211b]">{gap.label}</p>
                <p className="text-[10px] text-[#667169]">
                  {categoryLabel[gap.category]} · {cfg.label}
                </p>
              </div>
              {isActive && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
              )}
            </div>
          );
        })}
      </div>

      {/* Guardrail counter */}
      {guardrailCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/30 bg-amber-50 px-3 py-2">
          <span className="text-amber-500">⚠</span>
          <p className="text-[10px] font-semibold text-amber-700">
            {guardrailCount} ghostwriting {guardrailCount === 1 ? "attempt" : "attempts"} blocked
          </p>
        </div>
      )}
    </div>
  );
}
