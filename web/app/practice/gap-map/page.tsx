"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/shared/Layout";
import StepProgress from "@/components/roleready/StepProgress";
import ReadinessScoreCard from "@/components/roleready/ReadinessScoreCard";
import SkillGapMap from "@/components/roleready/SkillGapMap";

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

function GapMapContent() {
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

    // In a real implementation, we'd fetch the analysis from the backend
    // For now, we'll get it from sessionStorage (set by setup page)
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

  const handleContinue = () => {
    if (!sessionId) return;
    router.push(`/practice/prep-brief?session_id=${sessionId}`);
  };

  const handleBack = () => {
    router.push("/practice/setup");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <StepProgress activeStep={2} />
        <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-[#17211b]/10 bg-[#fcfbf7]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#17211b]/10 border-t-[#17211b]" />
            <p className="text-sm text-[#536058]">Loading your gap analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <StepProgress activeStep={2} />
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="mb-4 text-lg font-semibold text-rose-800">
            {error || "Analysis not found"}
          </p>
          <button
            onClick={handleBack}
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
      <StepProgress activeStep={2} />

      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-[#17211b]/15 bg-white/55 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#536058]">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          Analysis complete
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[#17211b] md:text-5xl">
          Your readiness gap map
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#536058]">
          {analysis.summary}
        </p>
      </div>

      {/* Readiness Score Card */}
      <ReadinessScoreCard score={analysis.readiness_score} />

      {/* Skill Gap Map */}
      <SkillGapMap
        strongMatches={analysis.strong_matches}
        partialMatches={analysis.partial_matches}
        missingOrWeak={analysis.missing_or_weak}
      />

      {/* Interview Focus Areas */}
      {analysis.interview_focus_areas.length > 0 && (
        <section className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
            Interview focus areas
          </h2>
          <p className="mb-4 text-sm leading-6 text-[#536058]">
            The interviewer will probe these areas to validate your experience:
          </p>
          <ul className="space-y-3">
            {analysis.interview_focus_areas.map((area, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-lg border border-[#17211b]/10 bg-white p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#e7efe9] text-xs font-semibold text-[#17211b]">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-[#45514a]">{area}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handleBack}
          className="rounded-lg border border-[#17211b]/15 bg-white px-5 py-3 text-sm font-semibold text-[#536058] transition hover:text-[#17211b]"
        >
          Back to setup
        </button>
        <button
          onClick={handleContinue}
          className="rounded-lg bg-[#17211b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2b3a31]"
        >
          Continue to prep brief
        </button>
      </div>
    </div>
  );
}

export default function GapMapPage() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="mx-auto max-w-4xl space-y-8">
            <StepProgress activeStep={2} />
            <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-[#17211b]/10 bg-[#fcfbf7]">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#17211b]/10 border-t-[#17211b]" />
                <p className="text-sm text-[#536058]">Loading your gap analysis...</p>
              </div>
            </div>
          </div>
        }
      >
        <GapMapContent />
      </Suspense>
    </Layout>
  );
}
