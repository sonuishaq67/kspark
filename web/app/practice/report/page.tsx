"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Layout from "@/components/shared/Layout";
import FollowUpAnalysis from "@/components/roleready/FollowUpAnalysis";
import NextPracticePlan from "@/components/roleready/NextPracticePlan";
import ReportSummary from "@/components/roleready/ReportSummary";
import ScoreCard from "@/components/roleready/ScoreCard";
import StepProgress from "@/components/roleready/StepProgress";
import { ApiError, api } from "@/lib/api";
import { GapReportItem, ReportResponse, ReportScores } from "@/lib/types";

const SCORE_JUSTIFICATIONS: Record<keyof ReportScores, string> = {
  role_alignment: "How tightly your answers matched the target role and its expected priorities.",
  technical_clarity: "How clearly and correctly you explained technical decisions and concepts.",
  communication: "How structured, concise, and easy to follow your responses were.",
  evidence_strength: "How well you backed claims with concrete examples, outcomes, and metrics.",
  followup_recovery: "How effectively you improved once the interviewer probed a weak area.",
};

function gapTone(status: GapReportItem["status"]) {
  if (status === "closed") {
    return "border-green-700/40 bg-green-950/30 text-green-200";
  }
  if (status === "improved") {
    return "border-amber-700/40 bg-amber-950/30 text-amber-200";
  }
  return "border-red-700/40 bg-red-950/30 text-red-200";
}

function PracticeReportContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [notReady, setNotReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      if (!sessionId) {
        setError("Missing session_id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.getReport(sessionId);
        if (!cancelled) {
          setReport(response);
          setNotReady(false);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotReady(true);
          setReport(null);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load report.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function handleGenerateReport() {
    if (!sessionId || generating) return;

    setGenerating(true);
    setError(null);

    try {
      await api.finishSession(sessionId);
      const response = await api.getReport(sessionId);
      setReport(response);
      setNotReady(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <StepProgress activeStep={5} />

        {loading ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-8 text-sm text-gray-400">
            Loading report...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-800/50 bg-red-950/30 p-5 text-sm text-red-200">
            {error}
          </div>
        ) : notReady ? (
          <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">
              Step 5
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-100">
              Report not ready
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400">
              The interview has not been finalized yet. Generate the report to score the session, capture the main gaps, and build the next practice plan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating ? "Generating..." : "Generate Report"}
              </button>
              <Link
                href="/dashboard"
                className="rounded-full border border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : report ? (
          <>
            <ReportSummary
              targetRole={report.target_role}
              startedAt={report.started_at}
              endedAt={report.ended_at}
              readinessScore={report.readiness_score ?? null}
              summary={report.summary}
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {(Object.entries(report.scores) as [keyof ReportScores, number][]).map(
                ([dimension, score]) => (
                  <ScoreCard
                    key={dimension}
                    dimension={dimension}
                    score={score}
                    justification={SCORE_JUSTIFICATIONS[dimension]}
                  />
                )
              )}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
                <h2 className="text-lg font-semibold text-gray-100">Strengths</h2>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-gray-300">
                  {report.strengths.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-3">
                      <span className="mt-1 text-green-300">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
                <h2 className="text-lg font-semibold text-gray-100">Gaps</h2>
                <div className="mt-4 space-y-3">
                  {report.gaps.map((gap, index) => (
                    <article
                      key={`${gap.label}-${index}`}
                      className={`rounded-2xl border p-4 ${gapTone(gap.status)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold">{gap.label}</h3>
                        <span className="rounded-full border border-current/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                          {gap.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-current/90">
                        {gap.evidence || "No evidence recorded."}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <FollowUpAnalysis items={report.follow_up_analysis} />
            <NextPracticePlan items={report.next_practice_plan} />

            <div className="flex flex-wrap gap-3">
              <Link
                href="/practice/setup"
                className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Start Another Session
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
              >
                Back to Dashboard
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
}

export default function PracticeReportPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-8 text-sm text-gray-400">
            Loading report...
          </div>
        </Layout>
      }
    >
      <PracticeReportContent />
    </Suspense>
  );
}
