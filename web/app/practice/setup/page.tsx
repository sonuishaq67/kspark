"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/shared/Layout";
import StepProgress from "@/components/roleready/StepProgress";
import { api } from "@/lib/api";

const RESUME_DRAFT_KEY = "roleready.resumeDraft";

const SESSION_TYPES = [
  {
    id: "BEHAVIORAL_PRACTICE",
    label: "Behavioral Practice",
    description: "STAR stories, leadership, conflict, teamwork.",
    icon: "🗣",
    defaultDuration: 15,
    defaultFocus: "tell me about yourself",
  },
  {
    id: "TECHNICAL_CONCEPT_PRACTICE",
    label: "Technical Concept",
    description: "Explain and defend a technical concept in depth.",
    icon: "⚙️",
    defaultDuration: 20,
    defaultFocus: "system design",
  },
  {
    id: "CODING_PRACTICE",
    label: "Coding Round",
    description: "LeetCode-style problem with approach and follow-ups.",
    icon: "💻",
    defaultDuration: 45,
    defaultFocus: "arrays and hashing",
  },
  {
    id: "RESUME_DEEP_DIVE",
    label: "Resume Deep Dive",
    description: "Probe ownership and depth of your projects.",
    icon: "📄",
    defaultDuration: 30,
    defaultFocus: "",
  },
  {
    id: "FULL_INTERVIEW",
    label: "Full Interview",
    description: "Complete loop: behavioral + technical + coding.",
    icon: "🎯",
    defaultDuration: 60,
    defaultFocus: "",
  },
  {
    id: "CUSTOM_QUESTION",
    label: "Custom Question",
    description: "Focused mini-interview around any topic you choose.",
    icon: "✏️",
    defaultDuration: 15,
    defaultFocus: "",
  },
];

const MODES = [
  {
    id: "learning",
    label: "Learning",
    description: "Hints when stuck. Explains what strong answers look like.",
  },
  {
    id: "professional",
    label: "Professional",
    description: "No hints. Realistic pressure. Mirrors a real interview.",
    recommended: true,
  },
];

const DIFFICULTIES = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium", recommended: true },
  { id: "hard", label: "Hard" },
];

function parseApiError(error: unknown): string {
  if (!(error instanceof Error)) return "Failed to parse resume file";

  try {
    const body = JSON.parse(error.message) as { detail?: string };
    if (body.detail) return body.detail;
  } catch {
    // Use the raw message below.
  }

  return error.message || "Failed to parse resume file";
}

// Example data for quick testing
const EXAMPLE_DATA = {
  resume: `John Doe
Software Engineer | 3 years experience

EXPERIENCE
Senior Software Engineer @ TechCorp (2022-Present)
- Led development of microservices architecture serving 1M+ users
- Reduced API latency by 40% through caching optimization
- Mentored 3 junior engineers on best practices

Software Engineer @ StartupXYZ (2020-2022)
- Built real-time chat feature using WebSockets and Redis
- Implemented CI/CD pipeline reducing deployment time by 60%
- Collaborated with product team on feature prioritization

SKILLS
Languages: Python, JavaScript, TypeScript, Go
Frameworks: React, Node.js, FastAPI, Django
Tools: Docker, Kubernetes, AWS, PostgreSQL, Redis

EDUCATION
B.S. Computer Science, State University (2020)`,

  jobDescription: `Senior Software Engineer - Backend
Google | Mountain View, CA

We're looking for a Senior Software Engineer to join our Cloud Infrastructure team.

RESPONSIBILITIES
- Design and implement scalable distributed systems
- Optimize performance of high-traffic APIs (10M+ requests/day)
- Collaborate with cross-functional teams on system architecture
- Mentor junior engineers and conduct code reviews
- Participate in on-call rotation for production systems

REQUIREMENTS
- 5+ years of software engineering experience
- Strong proficiency in Go, Python, or Java
- Experience with distributed systems and microservices
- Deep understanding of system design and scalability
- Experience with cloud platforms (GCP, AWS, or Azure)
- Strong communication and leadership skills

PREFERRED
- Experience with Kubernetes and container orchestration
- Knowledge of database optimization (SQL and NoSQL)
- Contributions to open-source projects
- Experience with monitoring and observability tools`,
};

export default function PracticeSetupPage() {
  const router = useRouter();

  const [sessionType, setSessionType] = useState("BEHAVIORAL_PRACTICE");
  const [mode, setMode] = useState("learning");
  const [difficulty, setDifficulty] = useState("medium");
  const [focusArea, setFocusArea] = useState("tell me about yourself");
  const [company, setCompany] = useState("");
  const [roleType, setRoleType] = useState("SDE1");
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = SESSION_TYPES.find((t) => t.id === sessionType)!;

  useEffect(() => {
    const draft = localStorage.getItem(RESUME_DRAFT_KEY);
    if (!draft) return;

    try {
      const parsed = JSON.parse(draft) as { text?: string };
      if (parsed.text) {
        setResume((current) => current || parsed.text || "");
      }
    } catch {
      localStorage.removeItem(RESUME_DRAFT_KEY);
    }
  }, []);

  const handleTypeChange = (id: string) => {
    setSessionType(id);
    const t = SESSION_TYPES.find((x) => x.id === id)!;
    setFocusArea(t.defaultFocus);
  };

  const [progress, setProgress] = useState<string>("");

  const handleResumeFile = async (file: File) => {
    if (!file) return;
    if (file.size > 5_000_000) {
      setError("Resume file too large — paste a summary instead");
      return;
    }

    if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
      setError(null);
      setProgress("Pulling resume text from PDF...");
      try {
        const parsed = await api.resume.parsePdf(file);
        setResume(parsed.text);
        localStorage.setItem(
          RESUME_DRAFT_KEY,
          JSON.stringify({
            text: parsed.text,
            filename: parsed.filename,
            pages: parsed.pages,
            uploadedAt: new Date().toISOString(),
          })
        );
      } catch (error) {
        setError(parseApiError(error));
      } finally {
        setProgress("");
      }
      return;
    }

    if (!/\.(txt|md|markdown)$/i.test(file.name)) {
      setError("Only .pdf, .txt, or .md files are supported.");
      return;
    }

    const text = await file.text();
    setResume(text);
    localStorage.setItem(
      RESUME_DRAFT_KEY,
      JSON.stringify({
        text,
        filename: file.name,
        uploadedAt: new Date().toISOString(),
      })
    );
    setError(null);
  };

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    setProgress("");

    try {
      // Step 1: research + context build (Tavily on legacy backend)
      let contextFile = "";
      if (company || resume || jobDescription) {
        setProgress(company ? `Researching ${company}…` : "Building interview context…");
        try {
          const research = await api.research.prepare({
            resume,
            job_description: jobDescription,
            company,
            role_type: roleType,
          });
          contextFile = research.context_file;
        } catch (researchErr) {
          // Non-fatal — AI Core can still derive from raw resume/JD
          console.warn("Research step failed, continuing without it:", researchErr);
        }
      }

      // Step 2: start AI Core session with the prepared context
      setProgress("Setting up interviewer…");
      const res = await api.aiCore.startSession({
        session_type: sessionType,
        duration_minutes: selectedType.defaultDuration,
        mode,
        focus_area: focusArea,
        company,
        role_type: roleType,
        resume,
        job_description: jobDescription,
        difficulty,
        context_file: contextFile,
      });

      const params = new URLSearchParams({
        session_id: res.session_id,
        intro: encodeURIComponent(res.intro_message),
        type: res.session_type,
        mode: res.mode,
        phases: res.phases.join(","),
        duration: String(res.duration_minutes),
      });

      router.push(`/practice/interview?${params.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start session");
      setLoading(false);
      setProgress("");
    }
  };

  const loadExampleData = () => {
    setResume(EXAMPLE_DATA.resume);
    setJobDescription(EXAMPLE_DATA.jobDescription);
    setCompany("Google");
    setRoleType("Senior SDE");
    setFocusArea("distributed systems and scalability");
  };

  const clearAllFields = () => {
    setResume("");
    setJobDescription("");
    setCompany("");
    setRoleType("SDE1");
    setFocusArea(selectedType.defaultFocus);
    localStorage.removeItem(RESUME_DRAFT_KEY);
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-8">
        <StepProgress activeStep={1} />

        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            New session
          </span>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Configure your <span className="text-gradient">mock interview</span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-gray-400">
            Pick the session type and drop in context. The AI adapts its phases, rubric, and questions accordingly.
          </p>
        </div>

        {/* Session type */}
        <section className="rounded-3xl glass p-6">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
            Session Type
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SESSION_TYPES.map((t) => {
              const active = sessionType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTypeChange(t.id)}
                  className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all ${
                    active
                      ? "border border-transparent bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/15 to-teal-400/15 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/40"
                      : "border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="mb-2 block text-xl">{t.icon}</span>
                  <p className="text-sm font-semibold text-white">{t.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-400">
                    {t.description}
                  </p>
                  {active && (
                    <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_12px_currentColor]" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Focus area */}
        <section className="rounded-3xl glass p-6">
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
            Focus Area
          </label>
          <input
            type="text"
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            placeholder={`e.g. "${selectedType.defaultFocus || "your topic"}"`}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-400/60 focus:bg-white/[0.07] focus:outline-none"
          />
        </section>

        {/* Company + Role */}
        <section className="grid grid-cols-2 gap-4 rounded-3xl glass p-6">
          <div>
            <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google, Akamai"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-400/60 focus:bg-white/[0.07] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
              Role
            </label>
            <input
              type="text"
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              placeholder="e.g. SDE1, SDE2"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-400/60 focus:bg-white/[0.07] focus:outline-none"
            />
          </div>
        </section>

        {/* Mode + Difficulty side-by-side on wide */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Mode */}
          <section className="rounded-3xl glass p-6">
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
              Mode
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {MODES.map((m) => {
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`relative rounded-2xl p-4 text-left transition-all ${
                      active
                        ? "border border-transparent bg-gradient-to-br from-indigo-500/25 to-fuchsia-500/15 ring-1 ring-indigo-400/40"
                        : "border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    {m.recommended && (
                      <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Default
                      </span>
                    )}
                    <p className="text-sm font-semibold text-white">{m.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-400">
                      {m.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Difficulty */}
          <section className="rounded-3xl glass p-6">
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
              Difficulty
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTIES.map((d) => {
                const active = difficulty === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={`relative rounded-xl py-3 text-sm font-semibold transition-all ${
                      active
                        ? "border border-transparent bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/20 text-white ring-1 ring-indigo-400/40"
                        : "border border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    {d.recommended && (
                      <span className="absolute right-1.5 top-1 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                        Default
                      </span>
                    )}
                    {d.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Optional: Resume + JD */}
        <section className="rounded-3xl glass p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
              Context — optional, recommended
            </h2>
            <div className="flex gap-2">
              <button
                onClick={loadExampleData}
                className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-200 transition-colors hover:bg-indigo-500/20"
              >
                📝 Load Example
              </button>
              <button
                onClick={clearAllFields}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-white/10"
              >
                🗑 Clear All
              </button>
            </div>
          </div>
          <p className="mb-4 text-xs text-gray-500">
            Tavily uses your resume + company to fetch interview signal, then the AI interviewer uses it to shape its persona and questions.
          </p>
          <div className="space-y-4">
            <div>
              <label className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                <span>Resume</span>
                <label className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold normal-case tracking-normal text-gray-300 transition-colors hover:border-indigo-400/50 hover:text-indigo-200">
                  Upload PDF / text
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleResumeFile(e.target.files[0])}
                  />
                </label>
              </label>
              <textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="Paste your resume or upload a PDF, .txt, or .md file..."
                rows={5}
                maxLength={8000}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-400/60 focus:bg-white/[0.07] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description..."
                rows={4}
                maxLength={8000}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-400/60 focus:bg-white/[0.07] focus:outline-none"
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-teal-400 py-4 text-sm font-semibold text-white shadow-2xl shadow-fuchsia-500/30 transition-shadow hover:shadow-fuchsia-500/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="absolute inset-0 sheen translate-x-[-100%] transition-transform duration-700 group-hover:translate-x-[100%]" />
          <span className="relative inline-flex items-center justify-center gap-2">
            {loading ? (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                {progress || "Starting session..."}
              </>
            ) : (
              <>
                Start {selectedType.label}
                <span aria-hidden>→</span>
              </>
            )}
          </span>
        </button>
      </div>
    </Layout>
  );
}
