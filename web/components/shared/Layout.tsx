import Link from "next/link";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-700/50 bg-indigo-950/70 text-sm font-semibold text-indigo-200 transition-colors group-hover:border-indigo-500">
              RR
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
                RoleReady
              </p>
              <span className="text-lg font-semibold tracking-tight text-gray-100 transition-colors group-hover:text-white">
                RoleReady AI
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/practice/setup" className="transition-colors hover:text-gray-100">
              Practice
            </Link>
            <Link href="/dashboard" className="transition-colors hover:text-gray-100">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
