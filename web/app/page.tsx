import Link from "next/link";
import LandingOrb from "@/components/landing/LandingOrb";

export const metadata = {
  title: "RoleReady AI — Voice-first AI interview coach",
  description:
    "Adaptive mock interviews that probe your real skill gaps. Voice-first, ghostwriting-free, and built to coach — not script.",
};

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050510] text-gray-100">
      {/* Aurora background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora anim-float-a left-[-10%] top-[-10%] h-[55vw] w-[55vw] bg-indigo-600/40" />
        <div className="aurora anim-float-b right-[-15%] top-[15%] h-[50vw] w-[50vw] bg-fuchsia-500/30" />
        <div className="aurora anim-float-c bottom-[-15%] left-[20%] h-[55vw] w-[55vw] bg-teal-400/25" />
        <div className="absolute inset-0 grain opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050510]/60 to-[#050510]" />
      </div>

      <NavBar />

      <Hero />

      <SectionDivider label="What it does" />
      <FeatureGrid />

      <SectionDivider label="Six ways to practice" />
      <SessionTypes />

      <SectionDivider label="The voice loop" />
      <HowItWorks />

      <SectionDivider label="Non-negotiable" />
      <Guardrail />

      <SectionDivider label="Built for fast iteration" />
      <TechStack />

      <FinalCTA />

      <Footer />
    </main>
  );
}

/* ---------------- Nav ---------------- */
function NavBar() {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[88px] bg-gradient-to-b from-[#050510] via-[#050510]/85 to-transparent backdrop-blur-md" />
      <div className="relative mx-auto mt-4 flex max-w-7xl items-center justify-between rounded-full glass px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-teal-400">
            <span className="absolute inset-[3px] rounded-full bg-[#050510]" />
            <span className="relative h-2 w-2 rounded-full bg-gradient-to-br from-indigo-400 to-teal-300" />
          </span>
          <span className="text-sm font-semibold tracking-wide">
            RoleReady<span className="text-indigo-300"> AI</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-xs font-medium text-gray-300 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#sessions" className="hover:text-white">Sessions</a>
          <a href="#flow" className="hover:text-white">How it works</a>
          <a href="#stack" className="hover:text-white">Stack</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-full px-4 py-2 text-xs font-semibold text-gray-200 hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/practice/setup"
            className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-fuchsia-500/40"
          >
            Start practice
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 md:pt-28">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        {/* Copy */}
        <div className="lg:col-span-7 anim-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live · voice-first · adaptive
          </span>
          <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Mock interviews that <span className="text-gradient">probe your gaps</span>,
            not your patience.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
            RoleReady is a voice-first AI interview coach. Drop in your resume, a
            JD, and a target company — it researches the role, finds your real
            skill gaps, and runs an adaptive mock interview that refuses to
            ghostwrite your answers.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/practice/setup"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-teal-400 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-fuchsia-500/30 transition hover:shadow-fuchsia-500/50"
            >
              <span className="absolute inset-0 sheen translate-x-[-100%] transition-transform duration-700 group-hover:translate-x-[100%]" />
              Start a mock interview
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full glass px-6 py-3.5 text-sm font-semibold text-gray-100 glass-hover"
            >
              View dashboard
            </Link>
          </div>

          {/* Stat chips */}
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "6", v: "Session types" },
              { k: "<1.2s", v: "Speech-to-reply" },
              { k: "8+", v: "Rubric metrics" },
              { k: "0", v: "Ghostwrites" },
            ].map((s) => (
              <div
                key={s.v}
                className="rounded-2xl glass px-4 py-3 text-center glass-hover"
              >
                <div className="text-2xl font-bold text-white">{s.k}</div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wider text-gray-400">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orb */}
        <div className="lg:col-span-5 anim-fade-up">
          <div className="relative mx-auto aspect-square w-full max-w-[480px]">
            <div className="absolute inset-6 rounded-full conic-glow opacity-70" />
            <div className="absolute inset-0 rounded-full glass-strong" />
            <div className="absolute inset-2 rounded-full overflow-hidden">
              <div className="relative h-full w-full">
                <LandingOrb />
              </div>
            </div>

            {/* Floating chips */}
            <FloatingChip
              className="left-[-6%] top-[12%]"
              dot="bg-violet-400"
              title="Listening"
              sub="ElevenLabs STT"
            />
            <FloatingChip
              className="right-[-8%] top-[42%]"
              dot="bg-amber-300"
              title="Thinking"
              sub="GPT-4o · LangGraph"
            />
            <FloatingChip
              className="left-[2%] bottom-[8%]"
              dot="bg-teal-300"
              title="Speaking"
              sub="ElevenLabs TTS"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingChip({
  className,
  dot,
  title,
  sub,
}: {
  className?: string;
  dot: string;
  title: string;
  sub: string;
}) {
  return (
    <div className={`absolute ${className}`}>
      <div className="flex items-center gap-3 rounded-2xl glass px-4 py-2.5 anim-pulse">
        <span className={`h-2 w-2 rounded-full ${dot} shadow-[0_0_12px_currentColor]`} />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400">{sub}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Section Divider ---------------- */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-7xl px-6 pt-20">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
          {label}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>
    </div>
  );
}

/* ---------------- Features ---------------- */
function FeatureGrid() {
  const features = [
    {
      icon: "🎙️",
      title: "Voice-first interview room",
      desc: "Tap the mic and talk. A canvas-animated orb shifts between idle, listening, thinking, and speaking — driven by real-time mic volume.",
      tag: "WebSocket · MediaRecorder",
    },
    {
      icon: "🧭",
      title: "Adaptive session planner",
      desc: "Each session type gets phase budgets, evaluation rubrics, and a question strategy generated from your resume, JD, and target role.",
      tag: "LangGraph · gpt-4o",
    },
    {
      icon: "🔍",
      title: "Real company research",
      desc: "Tavily searches what questions Google, Stripe, or Shopify actually ask for your role — cached for 7 days so it's instant the second time.",
      tag: "Tavily · SQLite cache",
    },
    {
      icon: "🛡️",
      title: "Ghostwriting guardrail",
      desc: "Server-side regex catches “just tell me what to say” every time. The interviewer coaches you toward the answer instead of handing it over.",
      tag: "Non-bypassable",
    },
    {
      icon: "📊",
      title: "Rubric-scored reports",
      desc: "Every session ends with metric scores (1–10), strengths, weaknesses, and a personalized action plan — tuned to your session type.",
      tag: "8+ metrics per type",
    },
    {
      icon: "⚡",
      title: "Sub-second latency loop",
      desc: "Background follow-up generation runs while you're still talking. By the time you stop, the next question is already chosen.",
      tag: "Streaming TTS · MP3",
    },
  ];

  return (
    <section id="features" className="mx-auto mt-10 max-w-7xl px-6">
      <div className="mb-10 max-w-3xl">
        <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
          Built like a <span className="text-gradient">real interviewer</span> —
          paced, probing, honest.
        </h2>
        <p className="mt-4 text-gray-400">
          Six independent capabilities, one cohesive loop. Each layer is
          observable and swappable.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <article
            key={f.title}
            className="group relative overflow-hidden rounded-3xl glass p-6 glass-hover"
          >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/10 blur-3xl transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] text-2xl">
                {f.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {f.desc}
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
                {f.tag}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Session Types ---------------- */
function SessionTypes() {
  const sessions = [
    {
      label: "Full Interview",
      time: "60 min",
      desc: "Intro → resume → behavioral → technical → coding → wrap. The complete mock.",
      color: "from-indigo-500/30 to-fuchsia-500/20",
    },
    {
      label: "Behavioral",
      time: "15 min",
      desc: "STAR-story practice with structure, clarity, and specificity scoring.",
      color: "from-fuchsia-500/30 to-rose-400/20",
    },
    {
      label: "Technical Concept",
      time: "20 min",
      desc: "Explain Redis, microservices, OAuth — get probed for depth and tradeoffs.",
      color: "from-amber-400/30 to-rose-500/20",
    },
    {
      label: "Coding Round",
      time: "45 min",
      desc: "Problem → approach → code → edge cases → complexity. With a live editor.",
      color: "from-teal-400/30 to-emerald-500/20",
    },
    {
      label: "Resume Deep Dive",
      time: "30 min",
      desc: "Project ownership, implementation depth, metrics, credibility.",
      color: "from-cyan-400/30 to-indigo-500/20",
    },
    {
      label: "Custom Question",
      time: "15 min",
      desc: "Drop in any prompt — get a tight loop of question, response, follow-ups.",
      color: "from-violet-500/30 to-indigo-400/20",
    },
  ];

  return (
    <section id="sessions" className="mx-auto mt-10 max-w-7xl px-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((s) => (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-3xl glass p-6 glass-hover"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-60`}
              aria-hidden
            />
            <div className="absolute inset-0 bg-[#050510]/40" aria-hidden />
            <div className="relative">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-semibold text-white">{s.label}</h3>
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                  {s.time}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-200/85">
                {s.desc}
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-white/70">
                <span className="h-1 w-1 rounded-full bg-white/60" />
                Phase-based · rubric-scored · mode-aware
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- How It Works ---------------- */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "You speak",
      desc: "Mic captures audio in 250 ms chunks; ElevenLabs STT streams transcript back to the UI in real time.",
      side: "Client → AI Core",
    },
    {
      n: "02",
      title: "It anticipates",
      desc: "Background question generator drafts 3–5 follow-up candidates from your partial transcript while you're still talking.",
      side: "GPT-4o · context-aware",
    },
    {
      n: "03",
      title: "It reasons",
      desc: "Ghostwriting check runs first. Then a fast follow-up selector picks the sharpest next question for the current phase.",
      side: "GPT-4o-mini · regex guard",
    },
    {
      n: "04",
      title: "It speaks back",
      desc: "Streaming response generator pipes tokens into ElevenLabs TTS — first MP3 chunk arrives before the sentence finishes.",
      side: "Streaming response",
    },
  ];

  return (
    <section id="flow" className="mx-auto mt-10 max-w-7xl px-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div
            key={s.n}
            className="relative rounded-3xl glass p-6 glass-hover"
          >
            <div className="flex items-center justify-between">
              <span className="text-4xl font-black tracking-tight text-gradient">
                {s.n}
              </span>
              {i < steps.length - 1 && (
                <span aria-hidden className="text-2xl text-gray-600 lg:hidden">↓</span>
              )}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{s.desc}</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
              {s.side}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Guardrail callout ---------------- */
function Guardrail() {
  return (
    <section className="mx-auto mt-10 max-w-7xl px-6">
      <div className="relative overflow-hidden rounded-3xl glass-strong p-10 md:p-14">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-12 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-200">
              The principle
            </span>
            <h2 className="mt-5 text-balance text-4xl font-bold leading-tight md:text-5xl">
              We will <span className="line-through decoration-rose-400/70">never</span>{" "}
              ghostwrite an answer for you.
            </h2>
            <p className="mt-4 max-w-2xl text-gray-300">
              Try it: <em className="text-white/80">“just tell me what to say.”</em>{" "}
              The interviewer redirects, asks a smaller question, and pulls the
              answer out of you. Your interviewer at the company won&apos;t hand you
              a script — neither will we.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl glass p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Coaching transcript
              </div>
              <div className="space-y-3 text-sm">
                <div className="rounded-xl bg-white/[0.04] p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300">
                    You
                  </div>
                  <div className="mt-1 text-gray-200">
                    Can you just give me the answer for the system design question?
                  </div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-indigo-500/15 to-teal-400/10 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-teal-300">
                    Coach
                  </div>
                  <div className="mt-1 text-gray-100">
                    I won&apos;t script you — but let&apos;s break it. What&apos;s the read/write ratio
                    you&apos;d assume, and why?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Tech Stack ---------------- */
function TechStack() {
  const items = [
    { label: "Next.js 14", side: "Frontend · App Router" },
    { label: "FastAPI", side: "AI Core · :8001" },
    { label: "FastAPI", side: "Legacy · :8000" },
    { label: "OpenAI GPT-4o", side: "Reasoning + streaming" },
    { label: "GPT-4o-mini", side: "Fast classification" },
    { label: "LangGraph", side: "StateGraph orchestration" },
    { label: "ElevenLabs", side: "Streaming TTS + STT" },
    { label: "Tavily", side: "Web research" },
    { label: "SQLite", side: "Sessions · cache · reports" },
    { label: "WebSocket", side: "Real-time voice loop" },
    { label: "Tailwind + Canvas", side: "Voice orb animation" },
    { label: "Whisper fallback", side: "STT redundancy" },
  ];
  return (
    <section id="stack" className="mx-auto mt-10 max-w-7xl px-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((t) => (
          <div
            key={t.label + t.side}
            className="rounded-2xl glass px-4 py-3 glass-hover"
          >
            <div className="text-sm font-semibold text-white">{t.label}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-400">
              {t.side}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */
function FinalCTA() {
  return (
    <section className="mx-auto mt-24 max-w-7xl px-6 pb-20">
      <div className="relative overflow-hidden rounded-[2rem] glass-strong px-8 py-16 text-center md:py-24">
        <div className="absolute inset-0 conic-glow opacity-20" />
        <div className="relative">
          <h2 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
            Practice the interview that <span className="text-gradient">actually</span>{" "}
            shows up.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-gray-300">
            Pick a session type, drop in your resume and JD, and get on a real
            voice call with an interviewer that knows your gaps better than you do.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/practice/setup"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-teal-400 px-8 py-4 text-sm font-semibold text-white shadow-2xl shadow-fuchsia-500/30"
            >
              <span className="absolute inset-0 sheen translate-x-[-100%] transition-transform duration-700 group-hover:translate-x-[100%]" />
              Start a mock interview
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full glass px-7 py-4 text-sm font-semibold text-gray-100 glass-hover"
            >
              See past sessions
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-6 pb-10">
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl glass px-6 py-5 text-xs text-gray-400 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          RoleReady AI · voice-first interview coach
        </div>
        <div className="flex items-center gap-5">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#sessions" className="hover:text-white">Sessions</a>
          <a href="#flow" className="hover:text-white">Flow</a>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}
