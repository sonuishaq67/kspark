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
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-[#17211b]/15 bg-white/55 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#536058]">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            Coaching dashboard
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[#17211b] md:text-5xl">
            Track readiness and keep pressure on the gaps that matter.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#536058]">
            Revisit reports, upload resume context, and start the next focused practice session from one place.
          </p>
        </div>
        <Link
          href="/practice/setup"
          className="inline-flex items-center justify-center rounded-lg bg-[#17211b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2b3a31]"
        >
          Start practice
        </Link>
      </div>

      <ResumePdfUpload />

      {!hasSessions ? (
        <div className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] px-6 py-16 text-center shadow-sm">
          <div className="mx-auto max-w-xl">
            <div className="mx-auto mb-5 grid h-11 w-11 place-items-center rounded-lg bg-[#e7efe9] text-sm font-semibold text-[#17211b]">
              01
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#17211b]">
              Run your first mock interview
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#536058]">
              Compare your resume to the role, practice the right interview type, and come back here for a coaching-focused report scored against the rubric.
            </p>
            <Link
              href="/practice/setup"
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-[#17211b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b3a31]"
            >
              Start your first practice
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <DashboardStats sessions={displaySessions} />

          <div className="flex items-center gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#667169]">
              Recent sessions
            </h2>
            <div className="h-px flex-1 bg-[#17211b]/10" />
          </div>

          <div className="grid gap-4">
            {displaySessions.map((session) => (
              <SessionCard key={session.session_id} session={session} />
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
