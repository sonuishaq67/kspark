import { SessionListItem } from "@/lib/types";

interface DashboardStatsProps {
  sessions: SessionListItem[];
}

function averageReadinessScore(sessions: SessionListItem[]) {
  const scores = sessions
    .map((session) => session.readiness_score)
    .filter((score): score is number => typeof score === "number");

  if (!scores.length) return null;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
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

function scoreColor(score: number | null) {
  if (score === null) return "text-[#17211b]";
  if (score <= 40) return "text-rose-700";
  if (score <= 70) return "text-amber-700";
  return "text-emerald-700";
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[#17211b]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#536058]">{helper}</p>
    </div>
  );
}

export default function DashboardStats({ sessions }: DashboardStatsProps) {
  const averageScore = averageReadinessScore(sessions);
  const commonGap = mostCommonGap(sessions);

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <StatCard
        label="Total sessions"
        value={String(sessions.length)}
        helper="Completed and in-progress practice sessions."
      />
      <div className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
          Average readiness
        </p>
        <p className={`mt-3 text-3xl font-semibold tracking-tight ${scoreColor(averageScore)}`}>
          {averageScore === null ? "-" : `${averageScore} / 100`}
        </p>
        <p className="mt-2 text-sm leading-6 text-[#536058]">
          Mean pre-interview score across sessions with readiness data.
        </p>
      </div>
      <StatCard
        label="Most common gap"
        value={commonGap ?? "-"}
        helper="The open gap appearing most often in recent sessions."
      />
    </section>
  );
}
