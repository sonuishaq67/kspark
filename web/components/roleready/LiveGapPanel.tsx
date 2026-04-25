"use client";

interface LiveGapPanelProps {
  currentPhase: string | null;
  currentPhaseIndex: number;
  totalPhases: number;
  timeRemaining: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function phaseLabel(phase: string | null): string {
  if (!phase) return "Starting...";
  return phase
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function LiveGapPanel({
  currentPhase,
  currentPhaseIndex,
  totalPhases,
  timeRemaining,
}: LiveGapPanelProps) {
  const progress =
    totalPhases > 0 ? ((currentPhaseIndex) / totalPhases) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-800 bg-gray-900/70 p-4">
      {/* Phase info */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Current Phase
        </p>
        <p className="mt-1.5 text-sm font-semibold text-indigo-200">
          {phaseLabel(currentPhase)}
        </p>
      </div>

      {/* Phase progress bar */}
      {totalPhases > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
            <span>
              Phase {currentPhaseIndex + 1} of {totalPhases}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Timer */}
      {timeRemaining > 0 && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
            timeRemaining < 120
              ? "border-red-700/40 bg-red-950/30"
              : "border-gray-800 bg-gray-950/60"
          }`}
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 shrink-0 ${
              timeRemaining < 120 ? "text-red-400" : "text-gray-500"
            }`}
          >
            <path
              fillRule="evenodd"
              d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm.75 4a.75.75 0 0 0-1.5 0v4.25c0 .199.079.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06l-2.28-2.28V6Z"
              clipRule="evenodd"
            />
          </svg>
          <span
            className={`text-sm font-semibold tabular-nums ${
              timeRemaining < 120 ? "text-red-300" : "text-gray-300"
            }`}
          >
            {formatTime(timeRemaining)}
          </span>
          <span className="text-xs text-gray-500">remaining</span>
        </div>
      )}
    </div>
  );
}
