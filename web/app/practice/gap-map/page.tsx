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
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
            <p className="text-sm text-gray-400">Loading your gap analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <StepProgress activeStep={2} />
        <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-8 text-center">
          <p className="mb-4 text-lg font-semibold text-rose-200">
            {error || "Analysis not found"}
          </p>
          <button
            onClick={handleBack}
            className="rounded-full border border-white/20 bg-white/10 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            ← Back to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <StepProgress activeStep={2} />

      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-200">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Analysis Complete
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
          Your <span className="text-gradient">readiness gap map</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-gray-400">
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
        <section className="rounded-3xl glass p-6">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
            Interview Focus Areas
          </h2>
          <p className="mb-4 text-sm text-gray-400">
            The interviewer will probe these areas to validate your experience:
          </p>
          <ul className="space-y-3">
            {analysis.interview_focus_areas.map((area, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-300">
                  {index + 1}
                </span>
                <p className="text-sm text-gray-200">{area}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handleBack}
          className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10"
        >
          ← Back to Setup
        </button>
        <button
          onClick={handleContinue}
          className="group relative overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-teal-400 px-8 py-3 text-sm font-semibold text-white shadow-2xl shadow-fuchsia-500/30 transition-shadow hover:shadow-fuchsia-500/50"
        >
          <span className="absolute inset-0 sheen translate-x-[-100%] transition-transform duration-700 group-hover:translate-x-[100%]" />
          <span className="relative inline-flex items-center gap-2">
            Continue to Prep Brief
            <span aria-hidden>→</span>
          </span>
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
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
                <p className="text-sm text-gray-400">Loading your gap analysis...</p>
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
