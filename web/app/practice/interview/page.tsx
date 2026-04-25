"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/shared/Layout";
import CodingRoom from "@/components/live-code-review/CodingRoom";
import InterviewRoom from "@/components/roleready/InterviewRoom";

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read session config from query params (passed from setup page)
  const sessionId = searchParams.get("session_id");
  const introMessage = searchParams.get("intro") ?? "";
  const sessionType = searchParams.get("type") ?? "BEHAVIORAL_PRACTICE";
  const mode = searchParams.get("mode") ?? "learning";
  const phasesRaw = searchParams.get("phases") ?? "";
  const duration = parseInt(searchParams.get("duration") ?? "15", 10);

  const phases = phasesRaw ? phasesRaw.split(",") : [];
  const hasLiveCoding =
    sessionType === "CODING_PRACTICE" ||
    phases.some((phase) => phase.toUpperCase().includes("CODING"));

  // If no session_id, redirect to setup
  useEffect(() => {
    if (!sessionId) {
      router.replace("/practice/setup");
    }
  }, [sessionId, router]);

  if (!sessionId) {
    return (
      <Layout>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-8 text-sm text-gray-400">
          Redirecting to setup...
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullBleed={hasLiveCoding}>
      {hasLiveCoding ? (
        <CodingRoom
          sessionId={sessionId}
          introMessage={decodeURIComponent(introMessage)}
          sessionType={sessionType}
          mode={mode}
          phases={phases}
          durationMinutes={duration}
        />
      ) : (
        <InterviewRoom
          sessionId={sessionId}
          introMessage={decodeURIComponent(introMessage)}
          sessionType={sessionType}
          mode={mode}
          phases={phases}
          durationMinutes={duration}
        />
      )}
    </Layout>
  );
}

export default function PracticeInterviewPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-8 text-sm text-gray-400">
            Loading interview...
          </div>
        </Layout>
      }
    >
      <InterviewContent />
    </Suspense>
  );
}
