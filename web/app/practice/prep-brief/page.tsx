"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/shared/Layout";
import StepProgress from "@/components/roleready/StepProgress";
import PrepBriefCard from "@/components/roleready/PrepBriefCard";

interface SkillItem {
  label: string;
  evidence: string | null;
}

interface ReadinessAnalysis {
  session_id: string;
  readiness_score: number;
  summary: string;
  strong_matches: SkillItem[];
  partial_matches: SkillItem[];
  missing_or_weak: SkillItem[];
  interview_focus_areas: string[];
  prep_brief: string[];
}

function PrepBriefContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [analysis, setAnalysis] = useState<ReadinessAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    // Fetch analysis from sessionStorage (set by setup page)
    const stored = sessionStorage.getItem(`analysis_${sessionId}`);
    if (stored) {
      try {
        const data = JSON.parse(stored) as ReadinessAnalysis;
        setAnalysis(data);
      } catch {
        setError("Failed to load analysis data");
      }
    } else {
      setError("Analysis data not found. Please start from the setup page.");
    }
    setLoading(false);
  }, [sessionId]);

  const handleStartInterview = () => {
    if (!sessionId) return;
    router.push(`/practice/interview?session_id=${sessionId}`);
  };

  const handleBack = () => {
    if (!sessionId) return;
    router.push(`/practice/gap-map?session_id=${sessionId}`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <StepProgress activeStep={3} />
        <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-[#17211b]/10 bg-[#fcfbf7]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#17211b]/10 border-t-[#17211b]" />
            <p className="text-sm text-[#536058]">Loading your prep brief...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <StepProgress activeStep={3} />
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="mb-4 text-lg font-semibold text-rose-800">
            {error || "Analysis not found"}
          </p>
          <button
            onClick={() => router.push("/practice/setup")}
            className="rounded-lg bg-[#17211b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2b3a31]"
          >
            Back to setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <StepProgress activeStep={3} />

      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-[#17211b]/15 bg-white/55 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#536058]">
          <span className="h-2 w-2 rounded-full bg-amber-600" />
          Prep brief ready
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[#17211b] md:text-5xl">
          Your interview prep brief
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#536058]">
          Based on your gap analysis, here are the key areas to focus on before your interview.
        </p>
      </div>

      {/* Readiness Score Summary */}
      <section className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
              Your readiness score
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#536058]">
              {analysis.summary}
            </p>
          </div>
          <div className="shrink-0 rounded-lg border border-[#17211b]/10 bg-white px-6 py-4 text-center">
            <p className="text-4xl font-semibold text-[#17211b]">
              {analysis.readiness_score}
            </p>
            <p className="mt-1 text-xs text-[#667169]">out of 100</p>
          </div>
        </div>
      </section>

      {/* Interview Focus Areas */}
      {analysis.interview_focus_areas.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
              What the interviewer will probe
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#536058]">
              These are the specific areas where the interviewer will dig deeper to validate your experience:
            </p>
          </div>
          <div className="space-y-3">
            {analysis.interview_focus_areas.map((area, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg border border-[#17211b]/10 bg-white p-4 shadow-sm"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#e7efe9] text-xs font-semibold text-[#17211b]">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-[#45514a]">{area}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prep Brief Tips */}
      {analysis.prep_brief.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
              Actionable prep tips
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#536058]">
              Focus on these areas to strengthen your interview performance:
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {analysis.prep_brief.map((tip, index) => (
              <PrepBriefCard key={index} tip={tip} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Gap Summary */}
      <section className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
          Gap summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-2xl font-semibold text-emerald-900">
              {analysis.strong_matches.length}
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-700">Strong matches</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-2xl font-semibold text-amber-900">
              {analysis.partial_matches.length}
            </p>
            <p className="mt-1 text-xs font-medium text-amber-700">Partial matches</p>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center">
            <p className="text-2xl font-semibold text-rose-900">
              {analysis.missing_or_weak.length}
            </p>
            <p className="mt-1 text-xs font-medium text-rose-700">Missing or weak</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="rounded-lg border border-[#17211b]/10 bg-gradient-to-br from-[#e7efe9] to-[#fcfbf7] p-8 text-center shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-[#17211b]">
          Ready to practice?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#536058]">
          The interview will focus on your gaps and probe the areas where you need the most practice.
          Remember: we coach, we don&apos;t ghostwrite.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={handleBack}
            className="rounded-lg border border-[#17211b]/15 bg-white px-5 py-3 text-sm font-semibold text-[#536058] transition hover:text-[#17211b]"
          >
            Back to gap map
          </button>
          <button
            onClick={handleStartInterview}
            className="rounded-lg bg-[#17211b] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#2b3a31]"
          >
            Start interview
          </button>
        </div>
      </section>
    </div>
  );
}

export default function PrepBriefPage() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="mx-auto max-w-4xl space-y-8">
            <StepProgress activeStep={3} />
            <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-[#17211b]/10 bg-[#fcfbf7]">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#17211b]/10 border-t-[#17211b]" />
                <p className="text-sm text-[#536058]">Loading your prep brief...</p>
              </div>
            </div>
          </div>
        }
      >
        <PrepBriefContent />
      </Suspense>
    </Layout>
  );
}
