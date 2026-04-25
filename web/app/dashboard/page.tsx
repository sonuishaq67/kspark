import Link from "next/link";
import Layout from "@/components/shared/Layout";
import SessionCard from "@/components/p2/SessionCard";
import DashboardStats from "@/components/roleready/DashboardStats";
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
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">RoleReady AI — Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">
            Track readiness, revisit reports, and keep pressure on the gaps that still show up.
          </p>
        </div>
        <Link
          href="/practice/setup"
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Start Practice
        </Link>
      </div>

      {!hasSessions ? (
        <div className="rounded-3xl border border-dashed border-gray-800 bg-gray-900/40 px-6 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
            RoleReady AI
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-gray-100">
            Start your first practice
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-400">
            Compare your resume to the role, practice the right interview, and come back here for a coaching-focused report.
          </p>
          <Link
            href="/practice/setup"
            className="mt-8 inline-flex rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Start Your First Practice
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <DashboardStats sessions={displaySessions} />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Recent Sessions
          </h2>
          {displaySessions.map((s) => (
            <SessionCard key={s.session_id} session={s} />
          ))}
        </div>
      )}
    </Layout>
  );
}
