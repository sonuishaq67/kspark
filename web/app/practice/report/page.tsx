"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Layout from "@/components/shared/Layout";
import FollowUpAnalysis from "@/components/roleready/FollowUpAnalysis";
import GapProgressSection from "@/components/roleready/GapProgressSection";
import NextPracticePlan from "@/components/roleready/NextPracticePlan";
import ReportSummary from "@/components/roleready/ReportSummary";
import ScoreCard from "@/components/roleready/ScoreCard";
import StepProgress from "@/components/roleready/StepProgress";
import { ApiError, api } from "@/lib/api";
import { ReportResponse, ReportScores } from "@/lib/types";

const SCORE_JUSTIFICATIONS: Record<keyof ReportScores, string> = {
  role_alignment: "How tightly your answers matched the target role and its expected priorities.",
  technical_clarity: "How clearly and correctly you explained technical decisions and concepts.",
  communication: "How structured, concise, and easy to follow your responses were.",
  evidence_strength: "How well you backed claims with concrete examples, outcomes, and metrics.",
  followup_recovery: "How effectively you improved once the interviewer probed a weak area.",
};

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
          <div className="flex items-center gap-3 rounded-3xl glass p-8 text-sm text-gray-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
            Loading report...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-sm text-rose-200">
            {error}
          </div>
        ) : notReady ? (
          <div className="relative overflow-hidden rounded-3xl glass-strong p-10">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-indigo-200">
                Step 5
              </span>
              <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight md:text-4xl">
                Your <span className="text-gradient">report is waiting</span> to be built.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400">
                The interview has not been finalized yet. Generate the report to score the session, capture the main gaps, and build the next practice plan.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-teal-400 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-fuchsia-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="absolute inset-0 sheen translate-x-[-100%] transition-transform duration-700 group-hover:translate-x-[100%]" />
                  {generating ? "Generating..." : "Generate report"}
                  {!generating && <span aria-hidden>→</span>}
                </button>
                <Link
                  href="/dashboard"
                  className="rounded-full glass px-6 py-3 text-sm font-semibold text-gray-200 glass-hover"
                >
                  Back to dashboard
                </Link>
              </div>
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

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl glass p-6">
                <h2 className="text-lg font-semibold text-gray-100">Strengths</h2>
                <p className="mt-2 text-sm text-gray-400">
                  These are the behaviors and skills you demonstrated well during the interview.
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-gray-300">
                  {report.strengths.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-3">
                      <span className="mt-1 text-emerald-400">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <GapProgressSection
                gaps={report.gaps}
                title="Areas for Improvement"
                description="Skills and knowledge areas that need focused practice"
              />
            </section>

            <FollowUpAnalysis items={report.follow_up_analysis} />
            <NextPracticePlan items={report.next_practice_plan} />

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/practice/setup"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-teal-400 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-fuchsia-500/30"
              >
                <span className="absolute inset-0 sheen translate-x-[-100%] transition-transform duration-700 group-hover:translate-x-[100%]" />
                Start another session
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full glass px-6 py-3 text-sm font-semibold text-gray-200 glass-hover"
              >
                Back to dashboard
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
          <div className="flex items-center gap-3 rounded-3xl glass p-8 text-sm text-gray-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
            Loading report...
          </div>
        </Layout>
      }
    >
      <PracticeReportContent />
    </Suspense>
  );
}
