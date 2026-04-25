import Link from "next/link";

interface NextPracticePlanProps {
  items: string[];
}

function iconForItem(item: string) {
  const normalized = item.toLowerCase();

  if (normalized.includes("review") || normalized.includes("study") || normalized.includes("read")) {
    return "📚";
  }
  if (normalized.includes("build") || normalized.includes("code")) {
    return "💻";
  }
  return "🗣";
}

export default function NextPracticePlan({ items }: NextPracticePlanProps) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5">
        <h2 className="text-lg font-semibold text-gray-100">Next Practice Plan</h2>
        <p className="mt-3 text-sm italic text-gray-400">
          Practice recommendations will appear after the report is generated.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-100">Next Practice Plan</h2>
        <p className="mt-2 text-sm text-gray-400">
          Focus on a small number of repeatable drills instead of trying to fix everything at once.
        </p>
      </div>

      <ol className="space-y-3">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex gap-4 rounded-2xl border border-gray-800 bg-gray-950/70 p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-700 bg-gray-900 text-lg">
              <span aria-hidden="true">{iconForItem(item)}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Step {index + 1}
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-100">{item}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 border-t border-gray-800 pt-5">
        <Link
          href="/practice/setup"
          className="inline-flex items-center rounded-full border border-indigo-700/50 bg-indigo-950/60 px-4 py-2 text-sm font-semibold text-indigo-200 transition-colors hover:border-indigo-600 hover:text-white"
        >
          Start Another Session →
        </Link>
      </div>
    </section>
  );
}
