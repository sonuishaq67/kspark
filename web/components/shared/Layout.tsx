import Link from "next/link";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <span className="text-indigo-400 text-xl font-bold tracking-tight group-hover:text-indigo-300 transition-colors">
              Interview Coach
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/dashboard" className="hover:text-gray-100 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
