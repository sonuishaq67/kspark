interface StepProgressProps {
  activeStep: number;
}

const STEPS = ["Setup", "Gap Map", "Prep Brief", "Interview", "Report"];

export default function StepProgress({ activeStep }: StepProgressProps) {
  return (
    <div className="rounded-lg border border-[#17211b]/10 bg-white/55 p-3">
      <div className="grid gap-2 sm:grid-cols-5">
        {STEPS.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === activeStep;
          const isComplete = stepNumber < activeStep;

          return (
            <div
              key={label}
              className={`rounded-lg border px-4 py-3 ${
                isActive
                  ? "border-[#17211b] bg-[#17211b] text-white"
                  : isComplete
                    ? "border-emerald-700/20 bg-emerald-50 text-emerald-900"
                    : "border-[#17211b]/10 bg-[#fcfbf7] text-[#536058]"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
                Step {stepNumber}
              </p>
              <p className="mt-1 text-sm font-semibold">{label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
