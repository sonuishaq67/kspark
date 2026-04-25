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
Amazon | Seattle, WA

We're looking for a Senior Software Engineer to join our AWS Infrastructure team.

RESPONSIBILITIES
- Design and implement scalable distributed systems
- Optimize performance of high-traffic APIs (10M+ requests/day)
- Collaborate with cross-functional teams on system architecture
- Mentor junior engineers and conduct code reviews
- Participate in on-call rotation for production systems

REQUIREMENTS
- 5+ years of software engineering experience
- Strong proficiency in Java, Python, or Go
- Experience with distributed systems and microservices
- Deep understanding of system design and scalability
- Experience with cloud platforms (AWS, GCP, or Azure)
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

  const handleAnalyzeReadiness = async () => {
    if (!jobDescription.trim()) {
      setError("Please provide a job description");
      return;
    }
    if (!resume.trim()) {
      setError("Please provide your resume");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress("Analyzing your readiness...");

    try {
      const analysis = await api.readiness.analyze({
        job_description: jobDescription,
        resume: resume,
        company: company || undefined,
        role_type: roleType || undefined,
        interview_type: "mixed",
      });

      // Store analysis in sessionStorage for gap map page
      sessionStorage.setItem(
        `analysis_${analysis.session_id}`,
        JSON.stringify(analysis)
      );

      // Store raw inputs for prep-brief → interview flow
      sessionStorage.setItem("roleready.lastResume", resume);
      sessionStorage.setItem("roleready.lastJD", jobDescription);
      sessionStorage.setItem("roleready.lastCompany", company);
      sessionStorage.setItem("roleready.lastRoleType", roleType);

      // Navigate to gap map
      router.push(`/practice/gap-map?session_id=${analysis.session_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze readiness");
      setLoading(false);
      setProgress("");
    }
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
          console.warn("Research step failed, continuing without context:", researchErr);
          // Don't block — just skip research and go straight to interview
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
    setCompany("Amazon");
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
      <div className="mx-auto max-w-5xl space-y-8">
        <StepProgress activeStep={1} />

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-[#17211b]/15 bg-white/55 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#536058]">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              New session
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[#17211b] md:text-5xl">
              Configure a focused mock interview.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#536058]">
              Pick the session type, add role context, and choose how much pressure you want in the room.
            </p>
          </div>
          <div className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-4 text-sm text-[#536058] shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">Selected</div>
            <div className="mt-2 font-semibold text-[#17211b]">{selectedType.label}</div>
            <div className="mt-1">{selectedType.defaultDuration} min - {mode} - {difficulty}</div>
          </div>
        </div>

        <section className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
            Session type
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SESSION_TYPES.map((type) => {
              const active = sessionType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeChange(type.id)}
                  className={`rounded-lg border p-4 text-left transition ${
                    active
                      ? "border-[#17211b] bg-[#17211b] text-white"
                      : "border-[#17211b]/10 bg-white text-[#17211b] hover:border-[#17211b]/25"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{type.label}</p>
                    <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${active ? "bg-white/15 text-white" : "bg-[#e7efe9] text-[#536058]"}`}>
                      {type.defaultDuration}m
                    </span>
                  </div>
                  <p className={`mt-2 text-sm leading-6 ${active ? "text-white/75" : "text-[#536058]"}`}>
                    {type.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
          <section className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
              Focus area
            </label>
            <input
              type="text"
              value={focusArea}
              onChange={(event) => setFocusArea(event.target.value)}
              placeholder={`Example: ${selectedType.defaultFocus || "your topic"}`}
              className="w-full rounded-lg border border-[#17211b]/15 bg-white px-4 py-3 text-sm text-[#17211b] placeholder-[#8b948e] outline-none transition focus:border-[#17211b]"
            />
          </section>

          <section className="grid grid-cols-1 gap-4 rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
                Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Amazon, Akamai, Stripe"
                className="w-full rounded-lg border border-[#17211b]/15 bg-white px-4 py-3 text-sm text-[#17211b] placeholder-[#8b948e] outline-none transition focus:border-[#17211b]"
              />
            </div>
            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
                Role
              </label>
              <input
                type="text"
                value={roleType}
                onChange={(event) => setRoleType(event.target.value)}
                placeholder="SDE1, SDE2, Senior SDE"
                className="w-full rounded-lg border border-[#17211b]/15 bg-white px-4 py-3 text-sm text-[#17211b] placeholder-[#8b948e] outline-none transition focus:border-[#17211b]"
              />
            </div>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
              Mode
            </h2>
            <div className="grid gap-3">
              {MODES.map((item) => {
                const active = mode === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id)}
                    className={`rounded-lg border p-4 text-left transition ${
                      active
                        ? "border-[#17211b] bg-[#17211b] text-white"
                        : "border-[#17211b]/10 bg-white text-[#17211b] hover:border-[#17211b]/25"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{item.label}</p>
                      {item.recommended && (
                        <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${active ? "bg-white/15 text-white" : "bg-[#e7efe9] text-[#536058]"}`}>
                          Default
                        </span>
                      )}
                    </div>
                    <p className={`mt-2 text-sm leading-6 ${active ? "text-white/75" : "text-[#536058]"}`}>
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
              Difficulty
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTIES.map((item) => {
                const active = difficulty === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setDifficulty(item.id)}
                    className={`rounded-lg border px-3 py-4 text-sm font-semibold transition ${
                      active
                        ? "border-[#17211b] bg-[#17211b] text-white"
                        : "border-[#17211b]/10 bg-white text-[#536058] hover:border-[#17211b]/25"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
                Resume and role context
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#536058]">
                Add context to research the company, calculate readiness, and make follow-ups specific to the role.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadExampleData}
                className="rounded-lg border border-[#17211b]/15 bg-white px-3 py-2 text-xs font-semibold text-[#17211b] hover:bg-[#f4f1ea]"
              >
                Load example
              </button>
              <button
                onClick={clearAllFields}
                className="rounded-lg border border-[#17211b]/15 bg-white px-3 py-2 text-xs font-semibold text-[#536058] hover:text-[#17211b]"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
                <span>Resume</span>
                <label className="cursor-pointer rounded-lg border border-[#17211b]/15 bg-white px-3 py-1.5 text-[11px] font-semibold normal-case tracking-normal text-[#17211b] hover:bg-[#f4f1ea]">
                  Upload file
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
                    className="hidden"
                    onChange={(event) => event.target.files?.[0] && handleResumeFile(event.target.files[0])}
                  />
                </label>
              </label>
              <textarea
                value={resume}
                onChange={(event) => setResume(event.target.value)}
                placeholder="Paste your resume or upload a PDF, .txt, or .md file..."
                rows={10}
                maxLength={8000}
                className="w-full resize-none rounded-lg border border-[#17211b]/15 bg-white px-4 py-3 text-sm leading-6 text-[#17211b] placeholder-[#8b948e] outline-none transition focus:border-[#17211b]"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
                Job description
              </label>
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the job description..."
                rows={10}
                maxLength={8000}
                className="w-full resize-none rounded-lg border border-[#17211b]/15 bg-white px-4 py-3 text-sm leading-6 text-[#17211b] placeholder-[#8b948e] outline-none transition focus:border-[#17211b]"
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div
            className={
              resume.trim() && jobDescription.trim()
                ? "grid gap-3 sm:grid-cols-2"
                : "grid gap-3"
            }
          >
            {resume.trim() && jobDescription.trim() && (
              <button
                onClick={handleAnalyzeReadiness}
                disabled={loading}
                className="w-full rounded-lg border border-[#17211b] bg-white py-4 text-sm font-semibold text-[#17211b] transition hover:bg-[#f7f5ef] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && progress.includes("Analyzing") ? progress : "Analyze resume"}
              </button>
            )}

            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full rounded-lg bg-[#17211b] py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2b3a31] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && !progress.includes("Analyzing")
                ? progress || "Starting session..."
                : resume.trim() && jobDescription.trim()
                  ? "Skip to interview"
                  : `Start ${selectedType.label}`}
            </button>
          </div>

          {resume.trim() && jobDescription.trim() && (
            <p className="text-center text-xs text-[#667169]">
              Tip: readiness analysis creates a gap map before the interview starts.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
