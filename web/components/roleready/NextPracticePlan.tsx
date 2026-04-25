import Link from "next/link";

interface NextPracticePlanProps {
  items: string[];
}

function iconForItem(item: string) {
  const normalized = item.toLowerCase();

  if (normalized.includes("review") || normalized.includes("study") || normalized.includes("read")) {
    return "📚";
  }
  if (normalized.includes("build") || normalized.includes("code") || normalized.includes("implement")) {
    return "💻";
  }
  if (normalized.includes("practice") || normalized.includes("prepare") || normalized.includes("write")) {
    return "✍️";
  }
  return "🎯";
}

function priorityLabel(index: number, total: number) {
  if (index === 0) {
    return { label: "Highest Priority", color: "text-rose-300 bg-rose-500/15 border-rose-400/30" };
  }
  if (index === 1) {
    return { label: "High Priority", color: "text-amber-300 bg-amber-500/15 border-amber-400/30" };
  }
  if (index < total - 1) {
    return { label: "Medium Priority", color: "text-blue-300 bg-blue-500/15 border-blue-400/30" };
  }
  return { label: "Good to Have", color: "text-gray-300 bg-gray-500/15 border-gray-400/30" };
}

export default function NextPracticePlan({ items }: NextPracticePlanProps) {
  if (!items.length) {
    return (
      <div className="rounded-3xl glass p-6">
        <h2 className="text-lg font-semibold text-gray-100">Next Practice Plan</h2>
        <p className="mt-3 text-sm italic text-gray-400">
          Practice recommendations will appear after the report is generated.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-3xl glass p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100">Next Practice Plan</h2>
        <p className="mt-2 text-sm text-gray-400">
          Focus on these drills in order. Master the first two before moving to the rest.
        </p>
      </div>

      <ol className="space-y-4">
        {items.map((item, index) => {
          const priority = priorityLabel(index, items.length);
          return (
            <li
              key={`${item}-${index}`}
              className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/70 p-5 transition-all hover:border-gray-700 hover:shadow-lg"
            >
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-700 bg-gray-900 text-xl transition-transform group-hover:scale-110">
                  <span aria-hidden="true">{iconForItem(item)}</span>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Step {index + 1}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${priority.color}`}
                    >
                      {priority.label}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-gray-100">{item}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 rounded-2xl border border-indigo-700/30 bg-indigo-950/20 p-4">
        <div className="flex gap-3">
          <span className="text-lg" aria-hidden="true">
            💡
          </span>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-indigo-200">Practice Strategy</h4>
            <p className="mt-1 text-sm leading-6 text-indigo-300/90">
              Don&apos;t try to fix everything at once. Pick the first 1-2 items and practice them
              repeatedly until they become natural. Then move to the next items.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-800 pt-6">
        <Link
          href="/practice/setup"
          className="inline-flex items-center gap-2 rounded-full border border-indigo-700/50 bg-indigo-950/60 px-5 py-2.5 text-sm font-semibold text-indigo-200 transition-all hover:border-indigo-600 hover:bg-indigo-900/60 hover:text-white"
        >
          <span>Start Another Session</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
