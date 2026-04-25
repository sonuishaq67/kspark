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
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return `${mins} min`;
}

const personaLabel: Record<string, string> = {
  friendly: "Friendly",
  neutral: "Neutral",
  challenging: "Challenging",
};

function readinessTone(score?: number) {
  if (typeof score !== "number") return "border-[#17211b]/10 bg-white text-[#536058]";
  if (score <= 40) return "border-rose-200 bg-rose-50 text-rose-800";
  if (score <= 70) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export default function SessionCard({ session }: SessionCardProps) {
  const duration = formatDuration(session.started_at, session.ended_at);
  const isEnded = session.state === "ENDED";
  const title = session.target_role || "Generic Interview";

  return (
    <article className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-5 shadow-sm transition hover:border-[#17211b]/20">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold tracking-tight text-[#17211b]">{title}</h3>
            <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${readinessTone(session.readiness_score)}`}>
              Readiness {typeof session.readiness_score === "number" ? session.readiness_score : "-"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#667169]">
            <span>{formatDate(session.started_at)}</span>
            {duration && <span>{duration}</span>}
            <span>{personaLabel[session.persona_id] ?? session.persona_id}</span>
            <span>{session.questions_completed} / 3 questions</span>
          </div>

          <p className="mt-4 text-sm text-[#536058]">
            Main gap: <span className="font-medium text-[#17211b]">{session.main_gap || "-"}</span>
          </p>

          {session.tldr_preview ? (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#45514a]">
              {session.tldr_preview}
            </p>
          ) : (
            <p className="mt-3 text-sm italic text-[#667169]">
              {isEnded ? "No summary available" : "Session in progress..."}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 md:flex-col md:items-end">
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
              isEnded ? "bg-[#e7efe9] text-[#2f3a33]" : "bg-sky-50 text-sky-800"
            }`}
          >
            {isEnded ? "Completed" : "In progress"}
          </span>
          {isEnded && (
            <Link
              href={`/practice/report?session_id=${session.session_id}`}
              className="text-sm font-semibold text-[#17211b] underline-offset-4 hover:underline"
            >
              View report
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
