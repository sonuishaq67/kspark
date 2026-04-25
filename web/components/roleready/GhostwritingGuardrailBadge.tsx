"use client";

interface GhostwritingGuardrailBadgeProps {
  activationCount: number;
}

export default function GhostwritingGuardrailBadge({
  activationCount,
}: GhostwritingGuardrailBadgeProps) {
  if (activationCount === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
      <span className="text-amber-700" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <p className="text-xs font-semibold text-amber-900">
        Guardrail active: {activationCount} ghostwriting{" "}
        {activationCount === 1 ? "attempt" : "attempts"} blocked
      </p>
    </div>
  );
}
