import Link from "next/link";
import { SessionListItem } from "@/lib/types";

interface SessionCardProps {
  session: SessionListItem;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start: string, end: string | null) {
  if (!end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(ms / 60000);
  return `${mins} min`;
}

const personaLabel: Record<string, string> = {
  friendly: "Friendly",
  neutral: "Neutral",
  challenging: "Challenging",
};

function readinessTone(score?: number) {
  if (typeof score !== "number") {
    return "bg-gray-800 text-gray-300 border-gray-700";
  }
  if (score <= 40) {
    return "bg-red-900/40 text-red-300 border-red-700/50";
  }
  if (score <= 70) {
    return "bg-amber-900/40 text-amber-300 border-amber-700/50";
  }
  return "bg-green-900/40 text-green-300 border-green-700/50";
}

export default function SessionCard({ session }: SessionCardProps) {
  const duration = formatDuration(session.started_at, session.ended_at);
  const isEnded = session.state === "ENDED";
  const title = session.target_role || "Generic Interview";

  return (
    <div className="rounded-3xl glass p-6 glass-hover">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-lg font-semibold tracking-tight text-gray-100">{title}</h3>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${readinessTone(
                session.readiness_score
              )}`}
            >
              Readiness {typeof session.readiness_score === "number" ? session.readiness_score : "-"}
            </span>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-400">{formatDate(session.started_at)}</span>
            {duration && (
              <span className="text-xs text-gray-500">· {duration}</span>
            )}
            <span className="text-xs text-gray-500">
              · {personaLabel[session.persona_id] ?? session.persona_id}
            </span>
            <span className="text-xs text-gray-500">
              · {session.questions_completed} / 3 questions
            </span>
          </div>

          <p className="mb-3 text-sm text-gray-400">
            Main gap: <span className="text-gray-300">{session.main_gap || "-"}</span>
          </p>

          {session.tldr_preview ? (
            <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">
              {session.tldr_preview}
            </p>
          ) : (
            <p className="text-sm text-gray-500 italic">
              {isEnded ? "No summary available" : "Session in progress..."}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isEnded
                ? "bg-gray-700 text-gray-300"
                : "bg-indigo-900/50 text-indigo-400 border border-indigo-700/50"
            }`}
          >
            {isEnded ? "Completed" : "In progress"}
          </span>
          {isEnded && (
            <Link
              href={`/practice/report?session_id=${session.session_id}`}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              View report →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
