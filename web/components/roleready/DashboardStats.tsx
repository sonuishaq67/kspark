import { SessionListItem } from "@/lib/types";

interface DashboardStatsProps {
  sessions: SessionListItem[];
}

function averageReadinessScore(sessions: SessionListItem[]) {
  const scores = sessions
    .map((session) => session.readiness_score)
    .filter((score): score is number => typeof score === "number");

  if (!scores.length) return null;

  const total = scores.reduce((sum, score) => sum + score, 0);
  return Math.round(total / scores.length);
}

function mostCommonGap(sessions: SessionListItem[]) {
  const counts = new Map<string, number>();

  for (const session of sessions) {
    if (!session.main_gap) continue;
    counts.set(session.main_gap, (counts.get(session.main_gap) ?? 0) + 1);
  }

  let topGap: string | null = null;
  let topCount = 0;
  counts.forEach((count, gap) => {
    if (count > topCount) {
      topGap = gap;
      topCount = count;
    }
  });

  return topGap;
}

function readinessTone(score: number | null) {
  if (score === null) {
    return "text-gray-300";
  }
  if (score <= 40) {
    return "text-red-300";
  }
  if (score <= 70) {
    return "text-amber-300";
  }
  return "text-green-300";
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-50">{value}</p>
      <p className="mt-2 text-sm text-gray-400">{helper}</p>
    </div>
  );
}

export default function DashboardStats({ sessions }: DashboardStatsProps) {
  const averageScore = averageReadinessScore(sessions);
  const commonGap = mostCommonGap(sessions);

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <StatCard
        label="Total Sessions"
        value={String(sessions.length)}
        helper="Completed and in-progress practice sessions."
      />
      <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Average Readiness
        </p>
        <p className={`mt-3 text-3xl font-semibold tracking-tight ${readinessTone(averageScore)}`}>
          {averageScore === null ? "-" : `${averageScore} / 100`}
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Mean pre-interview score across sessions with readiness data.
        </p>
      </div>
      <StatCard
        label="Most Common Gap"
        value={commonGap ?? "-"}
        helper="The open gap that appears most often in your recent sessions."
      />
    </section>
  );
}
