interface SkillItem {
  label: string;
  evidence: string | null;
}

interface SkillGapMapProps {
  strongMatches: SkillItem[];
  partialMatches: SkillItem[];
  missingOrWeak: SkillItem[];
}

function SkillColumn({
  title,
  count,
  items,
  tone,
}: {
  title: string;
  count: number;
  items: SkillItem[];
  tone: "strong" | "partial" | "missing";
}) {
  const styles = {
    strong: "border-emerald-200 bg-emerald-50 text-emerald-900",
    partial: "border-amber-200 bg-amber-50 text-amber-900",
    missing: "border-rose-200 bg-rose-50 text-rose-900",
  }[tone];

  return (
    <div className={`rounded-lg border p-5 ${styles}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-xs opacity-75">
            {count} skill{count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm opacity-75">No skills in this category.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((skill, index) => (
            <li key={`${skill.label}-${index}`} className="rounded-lg border border-current/10 bg-white/70 p-3">
              <p className="text-sm font-semibold">{skill.label}</p>
              {skill.evidence && (
                <p className="mt-1 text-xs leading-5 opacity-75">{skill.evidence}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SkillGapMap({
  strongMatches,
  partialMatches,
  missingOrWeak,
}: SkillGapMapProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
          Skill gap analysis
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#536058]">
          Skills are grouped by the strength of evidence found in your resume and role context.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SkillColumn title="Strong matches" count={strongMatches.length} items={strongMatches} tone="strong" />
        <SkillColumn title="Partial matches" count={partialMatches.length} items={partialMatches} tone="partial" />
        <SkillColumn title="Missing or weak" count={missingOrWeak.length} items={missingOrWeak} tone="missing" />
      </div>
    </section>
  );
}
