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
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-5">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#17211b]/15 bg-white/55 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#536058]">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Session report
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-[#17211b] md:text-5xl">
              Interview feedback
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#536058]">
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
            className="shrink-0 rounded-lg border border-[#17211b]/15 bg-white px-4 py-2 text-sm font-semibold text-[#536058] transition hover:text-[#17211b]"
          >
            Dashboard
          </Link>
        </div>

        {/* TLDR */}
        {report.tldr ? (
          <div className="mb-6">
            <TLDRCard tldr={report.tldr} />
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-4 shadow-sm">
            <p className="text-sm italic text-[#667169]">
              Summary not yet generated. End the session to generate feedback.
            </p>
          </div>
        )}

        {/* Question breakdown */}
        {report.thread_summary && report.thread_summary.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
              Question Breakdown
            </h2>
            <QuestionBreakdown threadSummary={report.thread_summary} />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/interview/new"
            className="flex-1 rounded-lg bg-[#17211b] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#2b3a31]"
          >
            Start New Session
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 rounded-lg border border-[#17211b]/15 bg-white px-5 py-3 text-center text-sm font-semibold text-[#536058] transition hover:text-[#17211b]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </Layout>
  );
}
