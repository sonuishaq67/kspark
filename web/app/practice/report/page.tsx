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
import { AICoreReport, ReportResponse, ReportScores } from "@/lib/types";

const SCORE_JUSTIFICATIONS: Record<keyof ReportScores, string> = {
  role_alignment: "How tightly your answers matched the target role and its expected priorities.",
  technical_clarity: "How clearly and correctly you explained technical decisions and concepts.",
  communication: "How structured, concise, and easy to follow your responses were.",
  evidence_strength: "How well you backed claims with concrete examples, outcomes, and metrics.",
  followup_recovery: "How effectively you improved once the interviewer probed a weak area.",
};

function mapAICoreReport(report: AICoreReport): ReportResponse {
  const scoreFor = (dimension: keyof ReportScores) => {
    const normalized = dimension.replace(/_/g, " ");
    const match = report.metric_scores.find((item) =>
      item.metric.toLowerCase().replace(/_/g, " ").includes(normalized)
    );
    return match?.score ?? report.overall_score ?? 0;
  };

  const now = new Date().toISOString();
  return {
    session_id: report.session_id,
    target_role: report.session_type.replace(/_/g, " ").toLowerCase(),
    started_at: now,
    ended_at: now,
    readiness_score: report.overall_score,
    summary: `Overall interview score: ${report.overall_score}/10. ${
      report.strengths[0] ?? "Keep practicing with concrete examples and concise structure."
    }`,
    strengths: report.strengths,
    gaps: report.weaknesses.map((weakness) => ({
      label: weakness,
      status: "open",
      evidence: report.weakest_answer || weakness,
    })),
    scores: {
      role_alignment: scoreFor("role_alignment"),
      technical_clarity: scoreFor("technical_clarity"),
      communication: scoreFor("communication"),
      evidence_strength: scoreFor("evidence_strength"),
      followup_recovery: scoreFor("followup_recovery"),
    },
    follow_up_analysis: report.metric_scores.map((item) => ({
      question: item.metric,
      reason: item.rationale,
      candidate_response_quality: item.score >= 8 ? "strong" : item.score >= 5 ? "partial" : "weak",
    })),
    next_practice_plan: report.action_plan,
  };
}

function LoadingReport() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-8 text-sm text-[#536058]">
      <span className="h-2 w-2 animate-pulse rounded-full bg-[#17211b]" />
      Loading report...
    </div>
  );
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
        const cached = sessionStorage.getItem(`ai-core-report:${sessionId}`);
        if (cached) {
          const response = mapAICoreReport(JSON.parse(cached) as AICoreReport);
          if (!cancelled) {
            setReport(response);
            setNotReady(false);
          }
          return;
        }

        const aiCoreReport = await api.aiCore.getReport(sessionId);
        if (!cancelled) {
          sessionStorage.setItem(`ai-core-report:${sessionId}`, JSON.stringify(aiCoreReport));
          setReport(mapAICoreReport(aiCoreReport));
          setNotReady(false);
        }
      } catch (err) {
        if (cancelled) return;
        try {
          const response = await api.getReport(sessionId);
          if (!cancelled) {
            setReport(response);
            setNotReady(false);
          }
        } catch (legacyErr) {
          if (legacyErr instanceof ApiError && legacyErr.status === 404) {
            setNotReady(true);
            setReport(null);
          } else {
            setError(legacyErr instanceof Error ? legacyErr.message : "Failed to load report.");
          }
        }
        if (!(err instanceof ApiError && err.status === 404)) {
          console.warn("AI Core report load failed, tried legacy backend:", err);
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
      const aiCoreReport = await api.aiCore.endSession(sessionId);
      sessionStorage.setItem(`ai-core-report:${sessionId}`, JSON.stringify(aiCoreReport));
      setReport(mapAICoreReport(aiCoreReport));
      setNotReady(false);
    } catch (err) {
      try {
        await api.finishSession(sessionId);
        const response = await api.getReport(sessionId);
        setReport(response);
        setNotReady(false);
      } catch (legacyErr) {
        setError(legacyErr instanceof Error ? legacyErr.message : "Failed to generate report.");
      }
      if (!(err instanceof ApiError && err.status === 404)) {
        console.warn("AI Core report generation failed, tried legacy backend:", err);
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <StepProgress activeStep={5} />

        {loading ? (
          <LoadingReport />
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
            {error}
          </div>
        ) : notReady ? (
          <div className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-8 shadow-sm">
            <div className="mb-4 inline-flex rounded-lg border border-[#17211b]/15 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#536058]">
              Step 5
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#17211b] md:text-4xl">
              Your report is waiting to be built.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#536058]">
              The interview has not been finalized yet. Generate the report to score the session, capture the main gaps, and build the next practice plan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className="inline-flex items-center justify-center rounded-lg bg-[#17211b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b3a31] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating ? "Generating..." : "Generate report"}
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-[#17211b]/15 bg-white px-5 py-3 text-sm font-semibold text-[#536058] transition hover:text-[#17211b]"
              >
                Back to dashboard
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

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#17211b]">Strengths</h2>
                <p className="mt-2 text-sm leading-6 text-[#536058]">
                  These are the behaviors and skills you demonstrated well during the interview.
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-[#45514a]">
                  {report.strengths.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-3">
                      <span className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                        OK
                      </span>
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

            <div className="flex flex-wrap gap-3">
              <Link
                href="/practice/setup"
                className="inline-flex items-center justify-center rounded-lg bg-[#17211b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b3a31]"
              >
                Start another session
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-[#17211b]/15 bg-white px-5 py-3 text-sm font-semibold text-[#536058] transition hover:text-[#17211b]"
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
          <LoadingReport />
        </Layout>
      }
    >
      <PracticeReportContent />
    </Suspense>
  );
}
