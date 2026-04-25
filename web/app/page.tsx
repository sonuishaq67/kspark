import Link from "next/link";

export const metadata = {
  title: "RoleReady AI - Interview practice for real job gaps",
  description:
    "RoleReady compares your resume to a target role, runs adaptive mock interviews, and turns each session into a focused practice plan.",
};

const navItems = [
  { href: "#workflow", label: "Workflow" },
  { href: "#practice", label: "Practice" },
  { href: "#reporting", label: "Reporting" },
  { href: "#principles", label: "Principles" },
];

const signals = [
  { label: "Role readiness", value: "72", note: "+14 after 3 sessions" },
  { label: "Priority gap", value: "System design", note: "Scaling trade-offs" },
  { label: "Next rep", value: "20 min", note: "Technical concept" },
];

const workflow = [
  {
    step: "01",
    title: "Map the role",
    text: "Paste a resume and job description. RoleReady extracts the skills, scope, seniority signals, and interview themes that matter for the target role.",
  },
  {
    step: "02",
    title: "Run the interview",
    text: "Choose a focused session or full loop. The interviewer listens, probes weak spots, and adapts follow-ups to the answer you actually gave.",
  },
  {
    step: "03",
    title: "Practice the gaps",
    text: "Every report ends with scored evidence, the gap that blocked the answer, and a short plan for the next practice session.",
  },
];

const practiceTypes = [
  ["Behavioral", "STAR structure, specificity, leadership, conflict"],
  ["Technical concept", "Depth, trade-offs, terminology, edge cases"],
  ["Coding round", "Approach, code quality, complexity, tests"],
  ["Resume deep dive", "Ownership, architecture, impact, credibility"],
  ["Full interview", "A complete loop across behavioral and technical phases"],
  ["Custom question", "A tight mini-session for any topic or prompt"],
];

const scoreRows = [
  { label: "Clarity", value: 84, tone: "bg-sky-600" },
  { label: "Technical depth", value: 68, tone: "bg-emerald-600" },
  { label: "Trade-off reasoning", value: 51, tone: "bg-amber-500" },
  { label: "Follow-up recovery", value: 74, tone: "bg-slate-700" },
];

const reportItems = [
  "Evidence-backed scores instead of generic encouragement",
  "A single main gap so the next session has a clear target",
  "Session history that shows whether the same weakness is shrinking",
  "Guardrails that coach your answer without writing it for you",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#17211b]">
      <NavBar />
      <Hero />
      <Workflow />
      <Practice />
      <Reporting />
      <Principles />
      <FinalCTA />
      <Footer />
    </main>
  );
}

function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#17211b]/10 bg-[#f4f1ea]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="RoleReady AI home">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#17211b] text-sm font-semibold text-[#f4f1ea]">
            RR
          </span>
          <span className="text-sm font-semibold tracking-tight">RoleReady AI</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-[#45514a] md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-[#17211b]">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-[#45514a] transition hover:bg-white/60 hover:text-[#17211b] sm:inline-flex"
          >
            Dashboard
          </Link>
          <Link
            href="/practice/setup"
            className="rounded-lg bg-[#17211b] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2b3a31]"
          >
            Start practice
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 pb-16 pt-12 sm:px-6 md:pb-20 md:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
      <div className="flex flex-col justify-center">
        <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-lg border border-[#17211b]/15 bg-white/55 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#45514a]">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          Adaptive interview practice
        </div>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-[#17211b] md:text-7xl">
          Practice the interview your target role will actually test.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#45514a]">
          RoleReady turns a resume and job description into focused voice mock interviews, targeted follow-ups, and reports that show exactly which gaps to fix next.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/practice/setup"
            className="inline-flex items-center justify-center rounded-lg bg-[#17211b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2b3a31]"
          >
            Start a mock interview
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-[#17211b]/15 bg-white/55 px-5 py-3 text-sm font-semibold text-[#17211b] transition hover:bg-white"
          >
            View readiness dashboard
          </Link>
        </div>

        <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          {signals.map((signal) => (
            <div key={signal.label} className="rounded-lg border border-[#17211b]/10 bg-white/55 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#6b746f]">
                {signal.label}
              </div>
              <div className="mt-2 text-xl font-semibold tracking-tight text-[#17211b]">
                {signal.value}
              </div>
              <div className="mt-1 text-sm text-[#5b665f]">{signal.note}</div>
            </div>
          ))}
        </div>
      </div>

      <HeroPreview />
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative flex items-center lg:justify-end">
      <div className="w-full max-w-[620px] overflow-hidden rounded-lg border border-[#17211b]/12 bg-[#fcfbf7] shadow-[0_24px_80px_rgba(23,33,27,0.16)]">
        <div className="flex items-center justify-between border-b border-[#17211b]/10 bg-white px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-[#17211b]">Backend Engineer interview</div>
            <div className="mt-0.5 text-xs text-[#667169]">Professional mode - 20 minute technical concept</div>
          </div>
          <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            Live
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_220px]">
          <div className="border-b border-[#17211b]/10 p-5 md:border-b-0 md:border-r">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#17211b] text-xs font-semibold text-white">
                AI
              </div>
              <div>
                <div className="text-sm font-semibold text-[#17211b]">Question 4</div>
                <div className="text-xs text-[#667169]">Probing distributed systems depth</div>
              </div>
            </div>

            <div className="rounded-lg border border-[#17211b]/10 bg-[#f7f5ef] p-4">
              <p className="text-sm leading-6 text-[#2f3a33]">
                You mentioned Redis for caching. What happens when a popular key expires and thousands of requests arrive at once?
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <TranscriptLine speaker="You" text="I would add a TTL and warm the cache from the database." />
              <TranscriptLine speaker="Coach" text="Good start. Now defend the failure mode: what prevents a cache stampede while the refresh is still running?" active />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                ["Listening", "bg-sky-600"],
                ["Follow-up ready", "bg-emerald-600"],
                ["No scripts", "bg-amber-500"],
              ].map(([label, tone]) => (
                <div key={label} className="rounded-lg border border-[#17211b]/10 bg-white p-3 text-center">
                  <div className={`mx-auto h-2 w-8 rounded-full ${tone}`} />
                  <div className="mt-2 text-[11px] font-medium text-[#45514a]">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="bg-[#edf3ef] p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#667169]">Gap map</div>
            <div className="mt-4 space-y-4">
              <GapBar label="Scaling" value="78%" width="w-[78%]" tone="bg-emerald-600" />
              <GapBar label="Failure modes" value="46%" width="w-[46%]" tone="bg-amber-500" />
              <GapBar label="Data modeling" value="62%" width="w-[62%]" tone="bg-sky-600" />
            </div>
            <div className="mt-6 rounded-lg border border-[#17211b]/10 bg-white p-4">
              <div className="text-xs font-semibold text-[#17211b]">Next prompt</div>
              <p className="mt-2 text-sm leading-5 text-[#45514a]">
                Compare lock-based refresh with stale-while-revalidate. Name the trade-off.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function TranscriptLine({
  speaker,
  text,
  active = false,
}: {
  speaker: string;
  text: string;
  active?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${active ? "border-emerald-700/25 bg-emerald-50" : "border-[#17211b]/10 bg-white"}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#667169]">{speaker}</div>
      <p className="mt-1 text-sm leading-5 text-[#2f3a33]">{text}</p>
    </div>
  );
}

function GapBar({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: string;
  width: string;
  tone: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs font-medium text-[#45514a]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white">
        <div className={`h-2 rounded-full ${width} ${tone}`} />
      </div>
    </div>
  );
}

function Workflow() {
  return (
    <section id="workflow" className="border-y border-[#17211b]/10 bg-white/45 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Workflow"
          title="A tighter loop than generic mock interviews."
          text="The product is built around one job: identify the gap, test it in conversation, and turn the result into the next useful rep."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {workflow.map((item) => (
            <article key={item.step} className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6">
              <div className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#dce8e1] text-sm font-semibold text-[#17211b]">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-[#17211b]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#536058]">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Practice() {
  return (
    <section id="practice" className="mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-20 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <SectionHeader
          eyebrow="Practice modes"
          title="Choose the round you need to improve."
          text="Each mode has its own pacing, rubric, and follow-up strategy, so a behavioral answer is not judged like a coding walkthrough."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {practiceTypes.map(([title, text]) => (
            <div key={title} className="rounded-lg border border-[#17211b]/10 bg-white/60 p-5">
              <h3 className="font-semibold text-[#17211b]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#536058]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Reporting() {
  return (
    <section id="reporting" className="bg-[#17211b] py-16 text-white md:py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9fb3a7]">Reporting</div>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
            Leave each session knowing what to practice next.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#cbd7cf]">
            Reports connect the answer you gave to a rubric, show the highest-impact gap, and keep the next session focused on evidence rather than vague confidence.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {reportItems.map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-[#e6eee9]">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#223027] p-5 shadow-2xl shadow-black/20">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="text-sm font-semibold">Session report</div>
              <div className="mt-1 text-xs text-[#aebdb4]">Backend Engineer - Technical concept</div>
            </div>
            <div className="rounded-lg bg-[#f4f1ea] px-4 py-2 text-center text-[#17211b]">
              <div className="text-2xl font-semibold leading-none">68</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]">Score</div>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {scoreRows.map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{row.label}</span>
                  <span className="text-[#cbd7cf]">{row.value}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div className={`h-2 rounded-full ${row.tone}`} style={{ width: `${row.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg bg-[#f4f1ea] p-4 text-[#17211b]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#536058]">Recommended next rep</div>
            <p className="mt-2 text-sm leading-6">
              Practice cache stampede prevention, stale reads, and backpressure before another system design round.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Principles() {
  return (
    <section id="principles" className="mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-20 lg:px-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#17211b]/10 bg-white/60 p-6 md:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#667169]">Principle</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#17211b] md:text-4xl">
            Coaching should make you stronger, not give you a script.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#536058]">
            If you ask for the answer, RoleReady redirects into smaller questions and evaluates your reasoning. That keeps the practice useful and closer to what happens in a real interview.
          </p>
        </div>
        <div className="rounded-lg border border-[#17211b]/10 bg-[#e7efe9] p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#667169]">Guardrail response</div>
          <p className="mt-4 text-lg font-medium leading-7 text-[#17211b]">
            &quot;I won&apos;t write the answer for you. Start with the constraint you would clarify first, then I&apos;ll push on the trade-off.&quot;
          </p>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 md:pb-20 lg:px-8">
      <div className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] px-6 py-10 text-center shadow-sm md:px-10 md:py-14">
        <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight text-[#17211b] md:text-5xl">
          Find the gaps before the onsite does.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#536058]">
          Start with the role you are targeting, run one focused session, and use the report to decide the next rep.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/practice/setup" className="inline-flex items-center justify-center rounded-lg bg-[#17211b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b3a31]">
            Start practice
          </Link>
          <Link href="/dashboard" className="inline-flex items-center justify-center rounded-lg border border-[#17211b]/15 bg-white px-5 py-3 text-sm font-semibold text-[#17211b] transition hover:bg-[#f7f5ef]">
            Open dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#17211b]/10 px-5 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-[#667169] md:flex-row md:items-center">
        <div>RoleReady AI - Interview practice for real job gaps</div>
        <div className="flex flex-wrap gap-5">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-[#17211b]">
              {item.label}
            </a>
          ))}
          <Link href="/practice/setup" className="hover:text-[#17211b]">Start practice</Link>
        </div>
      </div>
    </footer>
  );
}

function SectionHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#667169]">{eyebrow}</div>
      <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[#17211b] md:text-5xl">{title}</h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#536058]">{text}</p>
    </div>
  );
}
