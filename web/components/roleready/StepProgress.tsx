interface StepProgressProps {
  activeStep: number;
}

const STEPS = [
  "Setup",
  "Gap Map",
  "Prep Brief",
  "Interview",
  "Report",
];

export default function StepProgress({ activeStep }: StepProgressProps) {
  return (
    <div className="rounded-3xl glass p-4">
      <div className="grid gap-3 sm:grid-cols-5">
        {STEPS.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === activeStep;
          const isComplete = stepNumber < activeStep;

          return (
            <div
              key={label}
              className={`relative overflow-hidden rounded-2xl px-4 py-3 transition-all ${
                isActive
                  ? "border border-transparent bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/15 to-teal-400/15 ring-1 ring-indigo-400/40"
                  : isComplete
                    ? "border border-emerald-400/25 bg-emerald-500/10"
                    : "border border-white/10 bg-white/[0.03]"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                Step {stepNumber}
              </p>
              <p
                className={`mt-2 text-sm font-semibold ${
                  isActive
                    ? "text-white"
                    : isComplete
                      ? "text-emerald-200"
                      : "text-gray-300"
                }`}
              >
                {label}
              </p>
              {isActive && (
                <span className="absolute right-3 top-3 h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400 shadow-[0_0_10px_currentColor]" />
              )}
              {isComplete && (
                <span className="absolute right-3 top-3 text-emerald-300">✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
