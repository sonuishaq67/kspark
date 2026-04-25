interface SkillItem {
  label: string;
  evidence: string | null;
}

interface SkillGapMapProps {
  strongMatches: SkillItem[];
  partialMatches: SkillItem[];
  missingOrWeak: SkillItem[];
}

export default function SkillGapMap({
  strongMatches,
  partialMatches,
  missingOrWeak,
}: SkillGapMapProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
          Skill Gap Analysis
        </h2>
        <p className="text-sm text-gray-400">
          Your skills categorized by evidence strength
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Strong Matches */}
        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/5 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
              <span className="text-xl">✓</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-200">
                Strong Matches
              </h3>
              <p className="text-xs text-emerald-300/60">
                {strongMatches.length} skill{strongMatches.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {strongMatches.length === 0 ? (
            <p className="text-sm text-gray-400">No strong matches found</p>
          ) : (
            <ul className="space-y-3">
              {strongMatches.map((skill, index) => (
                <li
                  key={index}
                  className="group rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 transition-colors hover:bg-emerald-500/15"
                >
                  <p className="text-sm font-medium text-emerald-100">
                    {skill.label}
                  </p>
                  {skill.evidence && (
                    <p className="mt-1 text-xs leading-relaxed text-emerald-200/60">
                      {skill.evidence}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Partial Matches */}
        <div className="rounded-3xl border border-yellow-400/30 bg-yellow-500/5 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
              <span className="text-xl">~</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-yellow-200">
                Partial Matches
              </h3>
              <p className="text-xs text-yellow-300/60">
                {partialMatches.length} skill{partialMatches.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {partialMatches.length === 0 ? (
            <p className="text-sm text-gray-400">No partial matches found</p>
          ) : (
            <ul className="space-y-3">
              {partialMatches.map((skill, index) => (
                <li
                  key={index}
                  className="group rounded-xl border border-yellow-400/20 bg-yellow-500/10 p-3 transition-colors hover:bg-yellow-500/15"
                >
                  <p className="text-sm font-medium text-yellow-100">
                    {skill.label}
                  </p>
                  {skill.evidence && (
                    <p className="mt-1 text-xs leading-relaxed text-yellow-200/60">
                      {skill.evidence}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Missing or Weak */}
        <div className="rounded-3xl border border-rose-400/30 bg-rose-500/5 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20">
              <span className="text-xl">✗</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-200">
                Missing or Weak
              </h3>
              <p className="text-xs text-rose-300/60">
                {missingOrWeak.length} skill{missingOrWeak.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {missingOrWeak.length === 0 ? (
            <p className="text-sm text-gray-400">No missing skills found</p>
          ) : (
            <ul className="space-y-3">
              {missingOrWeak.map((skill, index) => (
                <li
                  key={index}
                  className="group rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 transition-colors hover:bg-rose-500/15"
                >
                  <p className="text-sm font-medium text-rose-100">
                    {skill.label}
                  </p>
                  {skill.evidence && (
                    <p className="mt-1 text-xs leading-relaxed text-rose-200/60">
                      {skill.evidence}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-emerald-300">
              {strongMatches.length}
            </p>
            <p className="text-xs text-gray-400">Strong</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-300">
              {partialMatches.length}
            </p>
            <p className="text-xs text-gray-400">Partial</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-rose-300">
              {missingOrWeak.length}
            </p>
            <p className="text-xs text-gray-400">Missing</p>
          </div>
        </div>
      </div>
    </section>
  );
}
