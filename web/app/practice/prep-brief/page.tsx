"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/shared/Layout";
import StepProgress from "@/components/roleready/StepProgress";
import { api } from "@/lib/api";

interface ReadinessAnalysis {
  session_id: string;
  readiness_score: number;
  summary: string;
  strong_matches: Array<{ label: string; evidence: string | null }>;
  partial_matches: Array<{ label: string; evidence: string | null }>;
  missing_or_weak: Array<{ label: string; evidence: string | null }>;
  interview_focus_areas: string[];
  prep_brief: string[];
}

function iconForTip(tip: string) {
  const t = tip.toLowerCase();
  if (t.includes("review") || t.includes("study") || t.includes("read")) return "📚";
  if (t.includes("practice") || t.includes("mock") || t.includes("rehearse")) return "🗣";
  if (t.includes("build") || t.includes("code") || t.includes("implement")) return "💻";
  if (t.includes("prepare") || t.includes("write") || t.includes("draft")) return "✏️";
  if (t.includes("research") || t.includes("company") || t.includes("team")) return "🔍";
  return "💡";
}

function PrepBriefContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [analysis, setAnalysis] = useState<ReadinessAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }
    const stored = sessionStorage.getItem(`analysis_${sessionId}`);
    if (stored) {
      try {
        setAnalysis(JSON.parse(stored) as ReadinessAnalysis);
      } catch {
        setError("Failed to load analysis data");
      }
    } else {
      setError("Analysis data not found. Please start from the setup page.");
    }
    setLoading(false);
  }, [sessionId]);

  const handleStartInterview = async () => {
    if (!analysis || starting) return;
    setStarting(true);
    setError(null);

    try {
      // Build context from the analysis
      const resume = sessionStorage.getItem("roleready.lastResume") ?? "";
      const jd = sessionStorage.getItem("roleready.lastJD") ?? "";
      const company = sessionStorage.getItem("roleready.lastCompany") ?? "";
      const roleType = sessionStorage.getItem("roleready.lastRoleType") ?? "SDE1";

      // Research step
      let contextFile = "";
      if (company) {
        setProgress(`Researching ${company}…`);
        try {
          const research = await api.research.prepare({
            resume, job_description: jd, company, role_type: roleType,
          });
          contextFile = research.context_file;
        } catch {
          // Continue without research
        }
      }

      // Start AI Core session
      setProgress("Setting up interviewer…");
      const focusAreas = analysis.interview_focus_areas;
      const focusArea = focusAreas.length > 0
        ? focusAreas.slice(0, 3).join(", ")
        : "general interview practice";

      const res = await api.aiCore.startSession({
        session_type: "BEHAVIORAL_PRACTICE",
        duration_minutes: 15,
        mode: "learning",
        focus_area: focusArea,
        company,
        role_type: roleType,
        resume,
        job_description: jd,
        difficulty: "medium",
        context_file: contextFile,
      });

      const params = new URLSearchParams({
        session_id: res.session_id,
        intro: encodeURIComponent(res.intro_message),
        type: res.session_type,
        mode: res.mode,
        phases: res.phases.join(","),
        duration: String(res.duration_minutes),
      });

      router.push(`/practice/interview?${params.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start session");
      setStarting(false);
      setProgress("");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <StepProgress activeStep={3} />
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
            <p className="text-sm text-[#536058]">Loading prep brief...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <StepProgress activeStep={3} />
        <div className="rounded-3xl border border-rose-300/30 bg-rose-50 p-8 text-center">
          <p className="mb-4 text-lg font-semibold text-rose-700">
            {error || "Prep brief not found"}
          </p>
          <button
            onClick={() => router.push("/practice/setup")}
            className="rounded-full border border-[#17211b]/20 bg-white px-6 py-2 text-sm font-medium text-[#17211b] transition-colors hover:bg-[#17211b]/5"
          >
            ← Back to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <StepProgress activeStep={3} />

      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#17211b]/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#536058]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Step 3 of 5
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight text-[#17211b] md:text-5xl">
          Your prep brief
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#536058]">
          Based on your gap analysis, here are the key things to focus on before your interview.
          These are coaching tips, not scripted answers.
        </p>
      </div>

      {/* Readiness reminder */}
      <div className="flex items-center gap-4 rounded-2xl border border-[#17211b]/10 bg-white p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#17211b] text-xl font-bold text-white">
          {analysis.readiness_score}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#667169]">
            Readiness Score
          </p>
          <p className="mt-1 text-sm text-[#536058]">{analysis.summary}</p>
        </div>
      </div>

      {/* Prep tips */}
      {analysis.prep_brief.length > 0 && (
        <section className="rounded-3xl border border-[#17211b]/10 bg-white p-6">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#667169]">
            Coaching Tips
          </h2>
          <ol className="space-y-3">
            {analysis.prep_brief.map((tip, i) => (
              <li
                key={i}
                className="flex gap-4 rounded-2xl border border-[#17211b]/5 bg-[#f4f1ea]/50 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#17211b]/10 bg-white text-lg">
                  {iconForTip(tip)}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#667169]">
                    Tip {i + 1}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#17211b]">{tip}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Key gaps to address */}
      {analysis.missing_or_weak.length > 0 && (
        <section className="rounded-3xl border border-[#17211b]/10 bg-white p-6">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#667169]">
            Gaps the Interviewer Will Probe
          </h2>
          <div className="space-y-2">
            {analysis.missing_or_weak.map((gap, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-rose-200/50 bg-rose-50/50 p-3"
              >
                <span className="mt-0.5 text-rose-400">✗</span>
                <div>
                  <p className="text-sm font-medium text-[#17211b]">{gap.label}</p>
                  {gap.evidence && (
                    <p className="mt-1 text-xs text-[#536058]">{gap.evidence}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Focus areas */}
      {analysis.interview_focus_areas.length > 0 && (
        <section className="rounded-3xl border border-[#17211b]/10 bg-white p-6">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#667169]">
            Interview Focus Areas
          </h2>
          <div className="flex flex-wrap gap-2">
            {analysis.interview_focus_areas.map((area, i) => (
              <span
                key={i}
                className="rounded-full border border-[#17211b]/10 bg-[#17211b]/5 px-3 py-1.5 text-xs font-medium text-[#17211b]"
              >
                {area}
              </span>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-300/30 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.push(`/practice/gap-map?session_id=${sessionId}`)}
          className="rounded-full border border-[#17211b]/20 bg-white px-6 py-3 text-sm font-medium text-[#17211b] transition-colors hover:bg-[#17211b]/5"
        >
          ← Back to Gap Map
        </button>
        <button
          onClick={handleStartInterview}
          disabled={starting}
          className="group relative overflow-hidden rounded-full bg-[#17211b] px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#2b3a31] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {starting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              {progress || "Starting..."}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Start Interview
              <span aria-hidden>→</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default function PrepBriefPage() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl space-y-8">
            <StepProgress activeStep={3} />
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-sm text-[#536058]">Loading prep brief...</p>
            </div>
          </div>
        }
      >
        <PrepBriefContent />
      </Suspense>
    </Layout>
  );
}
