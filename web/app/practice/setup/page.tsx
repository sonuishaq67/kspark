"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/shared/Layout";
import StepProgress from "@/components/roleready/StepProgress";
import { api } from "@/lib/api";

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

  const handleTypeChange = (id: string) => {
    setSessionType(id);
    const t = SESSION_TYPES.find((x) => x.id === id)!;
    setFocusArea(t.defaultFocus);
  };

  const [progress, setProgress] = useState<string>("");

  const handleResumeFile = async (file: File) => {
    if (!file) return;
    if (file.size > 1_000_000) {
      setError("Resume file too large — paste a summary instead");
      return;
    }
    if (!/\.(txt|md|markdown)$/i.test(file.name)) {
      setError("Only .txt or .md files are supported. Paste your resume into the box for other formats.");
      return;
    }
    const text = await file.text();
    setResume(text);
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

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <StepProgress activeStep={1} />

        <div>
          <h1 className="text-2xl font-bold text-gray-100">Start Practice</h1>
          <p className="mt-1 text-sm text-gray-400">
            Choose what you want to practice and the AI will adapt the session.
          </p>
        </div>

        {/* Session type */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Session Type
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SESSION_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTypeChange(t.id)}
                className={`relative rounded-2xl border p-4 text-left transition-all ${
                  sessionType === t.id
                    ? "border-indigo-600 bg-indigo-950/40"
                    : "border-gray-800 bg-gray-900/60 hover:border-gray-700"
                }`}
              >
                <span className="mb-2 block text-xl">{t.icon}</span>
                <p className="text-sm font-semibold text-gray-100">{t.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  {t.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Focus area */}
        <section>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Focus Area
          </label>
          <input
            type="text"
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            placeholder={`e.g. "${selectedType.defaultFocus || "your topic"}"`}
            className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:border-indigo-600 focus:outline-none"
          />
        </section>

        {/* Company + Role */}
        <section className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google, Akamai"
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Role
            </label>
            <input
              type="text"
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              placeholder="e.g. SDE1, SDE2"
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:border-indigo-600 focus:outline-none"
            />
          </div>
        </section>

        {/* Mode */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Mode
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`relative rounded-2xl border p-4 text-left transition-all ${
                  mode === m.id
                    ? "border-indigo-600 bg-indigo-950/40"
                    : "border-gray-800 bg-gray-900/60 hover:border-gray-700"
                }`}
              >
                {m.recommended && (
                  <span className="absolute right-3 top-3 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Default
                  </span>
                )}
                <p className="text-sm font-semibold text-gray-100">{m.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  {m.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Difficulty */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Difficulty
          </h2>
          <div className="flex gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`relative flex-1 rounded-xl border py-3 text-sm font-semibold transition-all ${
                  difficulty === d.id
                    ? "border-indigo-600 bg-indigo-950/40 text-indigo-200"
                    : "border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700"
                }`}
              >
                {d.recommended && (
                  <span className="absolute right-2 top-1.5 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    Default
                  </span>
                )}
                {d.label}
              </button>
            ))}
          </div>
        </section>

        {/* Optional: Resume + JD */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Context (Optional but recommended)
          </h2>
          <p className="mb-3 text-xs text-gray-500">
            The researcher uses your resume + the company name to fetch interview signal,
            then the AI interviewer uses that to shape its persona and questions.
          </p>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                <span>Resume</span>
                <label className="cursor-pointer rounded-full border border-gray-700 px-3 py-1 text-[10px] font-semibold normal-case tracking-normal text-gray-400 transition-colors hover:border-indigo-600 hover:text-indigo-300">
                  Upload .txt / .md
                  <input
                    type="file"
                    accept=".txt,.md,.markdown,text/plain,text/markdown"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleResumeFile(e.target.files[0])}
                  />
                </label>
              </label>
              <textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="Paste your resume or upload a .txt/.md file..."
                rows={5}
                maxLength={8000}
                className="w-full resize-none rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description..."
                rows={4}
                maxLength={8000}
                className="w-full resize-none rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-800/50 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full rounded-full bg-indigo-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (progress || "Starting session...") : `Start ${selectedType.label} →`}
        </button>
      </div>
    </Layout>
  );
}
