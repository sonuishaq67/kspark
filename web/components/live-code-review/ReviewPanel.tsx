"use client";

import { CodeReview } from "@/lib/types";
import { ConnectionStatus, ReviewStatus } from "@/lib/useInterviewSocket";

interface ReviewPanelProps {
  connectionStatus: ConnectionStatus;
  review: CodeReview | null;
  reviewStatus: ReviewStatus;
}

function reviewTone(severity: string) {
  if (severity === "error") return "border-rose-200 bg-rose-50 text-rose-950";
  if (severity === "warning") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-sky-200 bg-sky-50 text-sky-950";
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function statusTone(reviewStatus: ReviewStatus) {
  if (reviewStatus === "reviewing") return "border-amber-200 bg-amber-50 text-amber-800";
  if (reviewStatus === "error") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-[#17211b]/15 bg-[#f7f5ef] text-[#17211b]";
}

export default function ReviewPanel({
  connectionStatus,
  review,
  reviewStatus,
}: ReviewPanelProps) {
  return (
    <div className="max-h-80 min-h-[10rem] overflow-y-auto rounded-lg border border-[#17211b]/10 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#17211b]/10 pb-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#17211b]">
          Live Review
        </p>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${statusTone(
            reviewStatus
          )}`}
        >
          {reviewStatus === "reviewing"
            ? "reviewing"
            : review
              ? statusLabel(review.status)
              : connectionStatus}
        </span>
      </div>

      {reviewStatus === "reviewing" && (
        <div className="flex items-center gap-2 text-sm font-medium text-[#17211b]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          <span>Reviewing your latest update...</span>
        </div>
      )}

      {reviewStatus === "error" && !review && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="text-sm font-semibold text-rose-950">Live review is not connected.</p>
          <p className="mt-1 text-sm leading-6 text-rose-900">
            Keep coding; feedback will resume once the interview socket reconnects.
          </p>
        </div>
      )}

      {reviewStatus !== "reviewing" && reviewStatus !== "error" && !review && (
        <p className="text-sm font-medium leading-6 text-[#536058]">
          Start coding and pause briefly to get interviewer-style feedback.
        </p>
      )}

      {reviewStatus !== "reviewing" && review && (
        <div className="space-y-3">
          <p className="text-sm font-medium leading-6 text-[#17211b]">{review.summary}</p>

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
                    <p className="mt-2 text-sm leading-6 text-current opacity-85">
                      Hint: {issue.hint}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}

          {review.next_prompt && (
            <div className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#536058]">
                Interviewer Prompt
              </p>
              <p className="mt-1 text-sm font-medium leading-6 text-[#17211b]">
                {review.next_prompt}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
