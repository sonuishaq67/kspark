"use client";

import { CodeReview } from "@/lib/types";
import { ConnectionStatus, ReviewStatus } from "@/lib/useInterviewSocket";

interface ReviewPanelProps {
  connectionStatus: ConnectionStatus;
  review: CodeReview | null;
  reviewStatus: ReviewStatus;
}

function reviewTone(severity: string) {
  if (severity === "error") return "border-red-700/50 bg-red-950/30 text-red-200";
  if (severity === "warning") return "border-amber-700/50 bg-amber-950/30 text-amber-200";
  return "border-blue-700/50 bg-blue-950/30 text-blue-200";
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export default function ReviewPanel({
  connectionStatus,
  review,
  reviewStatus,
}: ReviewPanelProps) {
  return (
    <div className="max-h-80 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Live Review
        </p>
        <span className="rounded-full border border-gray-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
          {reviewStatus === "reviewing"
            ? "reviewing"
            : review
              ? statusLabel(review.status)
              : connectionStatus}
        </span>
      </div>

      {reviewStatus === "reviewing" && (
        <p className="text-sm text-gray-400">Reviewing your latest update...</p>
      )}

      {reviewStatus === "error" && !review && (
        <div className="rounded-lg border border-red-700/50 bg-red-950/30 p-3">
          <p className="text-sm font-semibold text-red-200">Live review is not connected.</p>
          <p className="mt-1 text-sm leading-6 text-red-200/80">
            Keep coding; feedback will resume once the interview socket reconnects.
          </p>
        </div>
      )}

      {reviewStatus !== "reviewing" && reviewStatus !== "error" && !review && (
        <p className="text-sm leading-6 text-gray-400">
          Start coding and pause briefly to get interviewer-style feedback.
        </p>
      )}

      {reviewStatus !== "reviewing" && review && (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-gray-200">{review.summary}</p>

          {review.issues.length > 0 && (
            <div className="space-y-2">
              {review.issues.map((issue, index) => (
                <article
                  key={`${issue.category}-${index}`}
                  className={`rounded-lg border p-3 ${reviewTone(issue.severity)}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                      {issue.category.replace(/_/g, " ")}
                    </p>
                    {issue.line && (
                      <span className="text-xs tabular-nums">line {issue.line}</span>
                    )}
                  </div>
                  <p className="text-sm leading-6">{issue.message}</p>
                  {issue.hint && (
                    <p className="mt-2 text-sm leading-6 text-current/80">
                      Hint: {issue.hint}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}

          {review.next_prompt && (
            <div className="rounded-lg border border-gray-700 bg-gray-950/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">
                Interviewer Prompt
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-300">
                {review.next_prompt}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
