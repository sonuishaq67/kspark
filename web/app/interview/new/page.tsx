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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">New Interview</h1>
        <p className="text-gray-400 text-sm mb-8">
          3 questions — behavioral, technical, system design. The AI probes your gaps.
        </p>

        {/* Mode selection */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Mode
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`
                  relative text-left p-4 rounded-xl border transition-all
                  ${
                    selectedMode === mode.id
                      ? "border-indigo-500 bg-indigo-950/40"
                      : "border-gray-700 bg-gray-800/40 hover:border-gray-600"
                  }
                `}
              >
                {mode.recommended && (
                  <span className="absolute top-2 right-2 text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">
                    Default
                  </span>
                )}
                <p className="font-semibold text-gray-100 text-sm mb-1">{mode.label}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{mode.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Persona selection */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Interviewer Persona
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => setSelectedPersona(persona.id)}
                className={`
                  relative text-left p-4 rounded-xl border transition-all
                  ${
                    selectedPersona === persona.id
                      ? "border-indigo-500 bg-indigo-950/40"
                      : "border-gray-700 bg-gray-800/40 hover:border-gray-600"
                  }
                `}
              >
                {persona.recommended && (
                  <span className="absolute top-2 right-2 text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">
                    Default
                  </span>
                )}
                <span className="text-2xl mb-2 block">{persona.icon}</span>
                <p className="font-semibold text-gray-100 text-sm mb-1">{persona.label}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{persona.description}</p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-base"
        >
          {loading ? "Starting..." : "Start Interview"}
        </button>
      </div>
    </Layout>
  );
}
