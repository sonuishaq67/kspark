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
    <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-4">
      <div className="grid gap-3 sm:grid-cols-5">
        {STEPS.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === activeStep;
          const isComplete = stepNumber < activeStep;

          return (
            <div
              key={label}
              className={`rounded-xl border px-4 py-3 ${
                isActive
                  ? "border-indigo-600 bg-indigo-950/60"
                  : isComplete
                    ? "border-green-700/40 bg-green-950/30"
                    : "border-gray-800 bg-gray-950/60"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Step {stepNumber}
              </p>
              <p
                className={`mt-2 text-sm font-medium ${
                  isActive ? "text-indigo-200" : isComplete ? "text-green-200" : "text-gray-300"
                }`}
              >
                {label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
