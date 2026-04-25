import Link from "next/link";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  /** Removes the max-width container for full workspace pages like the interview room. */
  fullBleed?: boolean;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice/setup", label: "Practice" },
  { href: "/interview/new", label: "Quick interview" },
];

export default function Layout({ children, fullBleed = false }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#17211b]">
      <header className="sticky top-0 z-40 border-b border-[#17211b]/10 bg-[#f4f1ea]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="RoleReady AI home">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#17211b] text-sm font-semibold text-[#f4f1ea]">
              RR
            </span>
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#667169]">
                RoleReady
              </p>
              <span className="text-sm font-semibold tracking-tight text-[#17211b]">
                AI Interview Coach
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#536058] transition hover:bg-white/60 hover:text-[#17211b]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/practice/setup"
            className="rounded-lg bg-[#17211b] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2b3a31]"
          >
            Start practice
          </Link>
        </div>
      </header>

      <main
        className={
          fullBleed
            ? "mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8"
            : "mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8"
        }
      >
        {children}
      </main>
    </div>
  );
}
