import Link from "next/link";

interface NextPracticePlanProps {
  items: string[];
}

function priorityLabel(index: number, total: number) {
  if (index === 0) return { label: "Highest priority", color: "text-rose-800 bg-rose-50 border-rose-200" };
  if (index === 1) return { label: "High priority", color: "text-amber-800 bg-amber-50 border-amber-200" };
  if (index < total - 1) return { label: "Medium priority", color: "text-sky-800 bg-sky-50 border-sky-200" };
  return { label: "Good to have", color: "text-[#536058] bg-white border-[#17211b]/10" };
}

export default function NextPracticePlan({ items }: NextPracticePlanProps) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#17211b]">Next Practice Plan</h2>
        <p className="mt-3 text-sm italic text-[#667169]">
          Practice recommendations will appear after the report is generated.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#17211b]">Next Practice Plan</h2>
        <p className="mt-2 text-sm leading-6 text-[#536058]">
          Focus on these drills in order. Master the first two before moving to the rest.
        </p>
      </div>

      <ol className="space-y-4">
        {items.map((item, index) => {
          const priority = priorityLabel(index, items.length);
          return (
            <li key={`${item}-${index}`} className="rounded-lg border border-[#17211b]/10 bg-white p-5">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#17211b] text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
                      Step {index + 1}
                    </span>
                    <span className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${priority.color}`}>
                      {priority.label}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-[#17211b]">{item}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 rounded-lg border border-[#17211b]/10 bg-white p-4">
        <h4 className="text-sm font-semibold text-[#17211b]">Practice strategy</h4>
        <p className="mt-1 text-sm leading-6 text-[#536058]">
          Do not try to fix everything at once. Pick the first one or two items and repeat them until the answer becomes natural.
        </p>
      </div>

      <div className="mt-6 border-t border-[#17211b]/10 pt-6">
        <Link
          href="/practice/setup"
          className="inline-flex items-center justify-center rounded-lg bg-[#17211b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2b3a31]"
        >
          Start another session
        </Link>
      </div>
    </section>
  );
}
