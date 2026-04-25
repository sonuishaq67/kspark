import Link from "next/link";
import Layout from "@/components/shared/Layout";
import SessionCard from "@/components/p2/SessionCard";
import DashboardStats from "@/components/roleready/DashboardStats";
import ResumePdfUpload from "@/components/roleready/ResumePdfUpload";
import { api } from "@/lib/api";
import { SessionListItem } from "@/lib/types";

async function getSessions(): Promise<SessionListItem[]> {
  try {
    return await api.listSessions();
  } catch {
    return [];
  }
}

function getDemoSession(): SessionListItem {
  return {
    session_id: "demo-backend-engineer-intern",
    started_at: new Date("2026-04-24T17:00:00Z").toISOString(),
    ended_at: new Date("2026-04-24T17:18:00Z").toISOString(),
    state: "ENDED",
    mode: "learning",
    persona_id: "friendly",
    questions_completed: 3,
    tldr_preview:
      "Strong API ownership and communication. Main improvement areas are database scaling, trade-offs, and measurable impact.",
    target_role: "Backend Engineer Intern",
    readiness_score: 58,
    main_gap: "Database scaling",
  };
}

export default async function DashboardPage() {
  const sessions = await getSessions();
  const displaySessions =
    sessions.length === 0 && process.env.MOCK_LLM === "1" ? [getDemoSession()] : sessions;
  const hasSessions = displaySessions.length > 0;

  return (
    <Layout>
      {/* Header */}
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Coaching dashboard
          </span>
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Track readiness — <span className="text-gradient">close the gaps that show up.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400">
            Revisit reports, see how your follow-up recovery is trending, and keep pressure on the gaps that still matter.
          </p>
        </div>
        <Link
          href="/practice/setup"
          className="group relative inline-flex items-center gap-2 self-start overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-teal-400 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-fuchsia-500/30 md:self-auto"
        >
          <span className="absolute inset-0 sheen translate-x-[-100%] transition-transform duration-700 group-hover:translate-x-[100%]" />
          Start practice
          <span aria-hidden>→</span>
        </Link>
      </div>

      <ResumePdfUpload />

      {!hasSessions ? (
        <div className="relative overflow-hidden rounded-3xl glass-strong px-8 py-20 text-center">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-indigo-200">
              First session
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-gray-100 md:text-4xl">
              Run your first mock interview
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-400">
              Compare your resume to the role, practice the right interview type, and come back here for a coaching-focused report scored against the rubric.
            </p>
            <Link
              href="/practice/setup"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-teal-400 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-fuchsia-500/30"
            >
              Start your first practice
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <DashboardStats sessions={displaySessions} />

          <div className="flex items-center gap-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
              Recent sessions
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
          </div>

          <div className="grid gap-4">
            {displaySessions.map((s) => (
              <SessionCard key={s.session_id} session={s} />
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
