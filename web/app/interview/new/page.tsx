"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/shared/Layout";
import { api } from "@/lib/api";

const PERSONAS = [
  {
    id: "friendly",
    label: "Friendly",
    description: "Warm and encouraging. Offers gentle nudges when you're stuck.",
    icon: "😊",
  },
  {
    id: "neutral",
    label: "Neutral",
    description: "Professional and matter-of-fact. Standard interview experience.",
    icon: "🎯",
    recommended: true,
  },
  {
    id: "challenging",
    label: "Challenging",
    description: "Pushes back on vague answers. High bar, no hand-holding.",
    icon: "🔥",
  },
];

const MODES = [
  {
    id: "professional",
    label: "Professional",
    description: "No hints. Strict scoring. Mirrors a real FAANG loop.",
    recommended: true,
  },
  {
    id: "learning",
    label: "Learning",
    description: "Patient interviewer. Explains what strong answers look like.",
  },
];

export default function NewInterviewPage() {
  const router = useRouter();
  const [selectedPersona, setSelectedPersona] = useState("neutral");
  const [selectedMode, setSelectedMode] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await api.createSession(selectedMode, selectedPersona);
      router.push(`/interview/${session.session_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start session");
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-[#17211b]/15 bg-white/55 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#536058]">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            Quick interview
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[#17211b] md:text-5xl">
            Start a focused three-question interview.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#536058]">
            Choose the interviewer tone and practice mode. The session covers behavioral,
            technical, and system design prompts with adaptive follow-ups.
          </p>
        </div>

        <section className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-5 shadow-sm">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
            Mode
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`
                  relative rounded-lg border p-4 text-left transition
                  ${
                    selectedMode === mode.id
                      ? "border-[#17211b] bg-[#e7efe9]"
                      : "border-[#17211b]/10 bg-white hover:border-[#17211b]/25"
                  }
                `}
              >
                {mode.recommended && (
                  <span className="absolute right-3 top-3 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">
                    Default
                  </span>
                )}
                <p className="mb-1 text-sm font-semibold text-[#17211b]">{mode.label}</p>
                <p className="max-w-sm text-xs leading-5 text-[#536058]">{mode.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-5 shadow-sm">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
            Interviewer Persona
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => setSelectedPersona(persona.id)}
                className={`
                  relative rounded-lg border p-4 text-left transition
                  ${
                    selectedPersona === persona.id
                      ? "border-[#17211b] bg-[#e7efe9]"
                      : "border-[#17211b]/10 bg-white hover:border-[#17211b]/25"
                  }
                `}
              >
                {persona.recommended && (
                  <span className="absolute right-3 top-3 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">
                    Default
                  </span>
                )}
                <span className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-[#f4f1ea] text-xl">
                  {persona.icon}
                </span>
                <p className="mb-1 text-sm font-semibold text-[#17211b]">{persona.label}</p>
                <p className="text-xs leading-5 text-[#536058]">{persona.description}</p>
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full rounded-lg bg-[#17211b] py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2b3a31] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Starting..." : "Start Interview"}
        </button>
      </div>
    </Layout>
  );
}
