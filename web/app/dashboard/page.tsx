import Link from "next/link";
import Layout from "@/components/shared/Layout";
import SessionCard from "@/components/p2/SessionCard";
import { api, SessionListItem } from "@/lib/api";

async function getSessions(): Promise<SessionListItem[]> {
  try {
    return await api.listSessions();
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const sessions = await getSessions();

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Practice interviews that actually probe your gaps.
          </p>
        </div>
        <Link
          href="/interview/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Start Interview
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-400 text-lg mb-2">No sessions yet</p>
          <p className="text-gray-500 text-sm mb-6">
            Start your first interview to see your history here.
          </p>
          <Link
            href="/interview/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Start Interview
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Recent Sessions
          </h2>
          {sessions.map((s) => (
            <SessionCard key={s.session_id} session={s} />
          ))}
        </div>
      )}
    </Layout>
  );
}
