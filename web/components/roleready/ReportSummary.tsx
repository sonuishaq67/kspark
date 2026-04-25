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
  const minutes = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
  return `${minutes} min`;
}

function readinessTone(score: number | null) {
  if (score === null || score === undefined) return "text-[#17211b]";
  if (score <= 40) return "text-rose-700";
  if (score <= 70) return "text-amber-700";
  return "text-emerald-700";
}

function SummaryMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#17211b]/10 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">{label}</div>
      <p className="mt-2 text-sm font-medium text-[#17211b]">{value}</p>
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
    <section className="overflow-hidden rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] shadow-sm">
      <div className="border-b border-[#17211b]/10 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
              Practice report
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#17211b]">
              {targetRole || "Generic Interview"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#536058]">{summary}</p>
          </div>

          <div className="rounded-lg border border-[#17211b]/10 bg-white px-5 py-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
              Readiness
            </span>
            <div className={`mt-2 text-4xl font-semibold leading-none ${readinessTone(readinessScore)}`}>
              {readinessScore ?? "-"}
            </div>
            <div className="mt-1 text-xs text-[#667169]">Pre-interview score</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5 sm:grid-cols-3 sm:px-8">
        <SummaryMeta label="Date" value={formatDate(startedAt)} />
        <SummaryMeta label="Duration" value={formatDuration(startedAt, endedAt)} />
        <SummaryMeta label="Status" value={endedAt ? "Completed" : "Active"} />
      </div>
    </section>
  );
}
