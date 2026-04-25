import Link from "next/link";
import { notFound } from "next/navigation";
import Layout from "@/components/shared/Layout";
import TLDRCard from "@/components/p2/TLDRCard";
import QuestionBreakdown from "@/components/p2/QuestionBreakdown";
import { api } from "@/lib/api";

interface ReportPageProps {
  params: { sessionId: string };
}

async function getReport(sessionId: string) {
  try {
    return await api.getLegacyReport(sessionId);
  } catch {
    return null;
  }
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
  if (!end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(ms / 60000);
  return `${mins} min`;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const report = await getReport(params.sessionId);

  if (!report) {
    notFound();
  }

  const duration = formatDuration(report.started_at, report.ended_at);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Session Report</h1>
            <p className="text-gray-400 text-sm mt-1">
              {formatDate(report.started_at)}
              {duration && ` · ${duration}`}
              {" · "}
              {report.questions_completed} / 3 questions
              {" · "}
              <span className="capitalize">{report.persona_id}</span> persona
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>

        {/* TLDR */}
        {report.tldr ? (
          <div className="mb-6">
            <TLDRCard tldr={report.tldr} />
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-800/40 border border-gray-700 rounded-xl">
            <p className="text-gray-400 text-sm italic">
              Summary not yet generated. End the session to generate feedback.
            </p>
          </div>
        )}

        {/* Question breakdown */}
        {report.thread_summary && report.thread_summary.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Question Breakdown
            </h2>
            <QuestionBreakdown threadSummary={report.thread_summary} />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/interview/new"
            className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
          >
            Start New Session
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 text-center bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold px-5 py-3 rounded-xl transition-colors border border-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </Layout>
  );
}
