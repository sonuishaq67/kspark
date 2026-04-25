import { ReactNode } from "react";

interface ReportSummaryProps {
  targetRole: string | null;
  startedAt: string;
  endedAt: string | null;
  readinessScore: number | null;
  summary: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start: string, end: string | null) {
  if (!end) return "In progress";

  const ms = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.max(1, Math.round(ms / 60000));
  return `${minutes} min`;
}

function readinessTone(score: number | null) {
  if (score === null || score === undefined) {
    return "bg-gray-800 text-gray-300 border-gray-700";
  }
  if (score <= 40) {
    return "bg-red-900/40 text-red-300 border-red-700/50";
  }
  if (score <= 70) {
    return "bg-amber-900/40 text-amber-300 border-amber-700/50";
  }
  return "bg-green-900/40 text-green-300 border-green-700/50";
}

function SummaryMeta({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
        <span className="text-indigo-400">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="text-sm font-medium text-gray-100">{value}</p>
    </div>
  );
}

export default function ReportSummary({
  targetRole,
  startedAt,
  endedAt,
  readinessScore,
  summary,
}: ReportSummaryProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950/40 shadow-2xl shadow-black/20">
      <div className="border-b border-gray-800/80 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">
              Practice Report
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-50 sm:text-3xl">
              {targetRole || "Generic Interview"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
              {summary}
            </p>
          </div>

          <div className="shrink-0">
            <div
              className={`inline-flex min-w-[8rem] flex-col rounded-2xl border px-4 py-3 text-left ${readinessTone(
                readinessScore
              )}`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                Readiness
              </span>
              <span className="mt-2 text-3xl font-semibold leading-none">
                {readinessScore ?? "-"}
              </span>
              <span className="mt-1 text-xs text-current/80">Pre-interview score</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5 sm:grid-cols-3 sm:px-8">
        <SummaryMeta
          label="Date"
          value={formatDate(startedAt)}
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.75 2a.75.75 0 0 1 .75.75V4h5V2.75a.75.75 0 0 1 1.5 0V4h.75A2.25 2.25 0 0 1 18 6.25v8.5A2.25 2.25 0 0 1 15.75 17h-11.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4H5V2.75A.75.75 0 0 1 5.75 2Zm9.75 6h-13v6.75c0 .414.336.75.75.75h11.5a.75.75 0 0 0 .75-.75V8Z" />
            </svg>
          }
        />
        <SummaryMeta
          label="Duration"
          value={formatDuration(startedAt, endedAt)}
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm.75 4a.75.75 0 0 0-1.5 0v4.25c0 .199.079.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06l-2.28-2.28V6Z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
        <SummaryMeta
          label="Status"
          value={endedAt ? "Completed" : "Active"}
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.312a1 1 0 0 1-1.418.002l-3.25-3.25a1 1 0 1 1 1.414-1.414l2.54 2.54 6.544-6.598a1 1 0 0 1 1.414-.006Z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
      </div>
    </section>
  );
}
