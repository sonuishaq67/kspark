import Link from "next/link";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  /** Removes the max-width container — useful for full-bleed pages like the interview room */
  fullBleed?: boolean;
}

export default function Layout({ children, fullBleed = false }: LayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050510] text-gray-100">
      {/* Ambient aurora background — shared with landing page */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora anim-float-a left-[-15%] top-[-15%] h-[55vw] w-[55vw] bg-indigo-600/30" />
        <div className="aurora anim-float-b right-[-20%] top-[10%] h-[50vw] w-[50vw] bg-fuchsia-500/20" />
        <div className="aurora anim-float-c bottom-[-20%] left-[10%] h-[55vw] w-[55vw] bg-teal-400/20" />
        <div className="absolute inset-0 grain opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050510]/60 to-[#050510]" />
      </div>

      {/* Sticky glass nav with backdrop band so content doesn't bleed through */}
      <header className="sticky top-0 z-40">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[88px] bg-gradient-to-b from-[#050510] via-[#050510]/85 to-transparent backdrop-blur-md" />
        <div className="relative px-4 pt-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full glass px-5 py-3">
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-teal-400">
              <span className="absolute inset-[3px] rounded-full bg-[#050510]" />
              <span className="relative h-2 w-2 rounded-full bg-gradient-to-br from-indigo-400 to-teal-300" />
            </span>
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-300">
                RoleReady
              </p>
              <span className="text-sm font-semibold tracking-tight text-gray-100 transition-colors group-hover:text-white">
                AI Interview Coach
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/dashboard"
              className="rounded-full px-4 py-2 text-xs font-semibold text-gray-300 transition-colors hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/practice/setup"
              className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 transition-shadow hover:shadow-fuchsia-500/40"
            >
              Start practice
            </Link>
          </nav>
          </div>
        </div>
      </header>

      <main
        className={
          fullBleed
            ? "px-4 py-8"
            : "mx-auto max-w-6xl px-4 py-10"
        }
      >
        {children}
      </main>
    </div>
  );
}
