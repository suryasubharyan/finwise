"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/components/providers/LanguageProvider";

function useNavItems() {
  const { t } = useLanguage();
  return [
    { href: "/dashboard", label: t.sidebar.overview, icon: "🏠", exact: true },
    { href: "/dashboard/payday-pace", label: t.sidebar.paydayPace, icon: "🔥" },
    { href: "/dashboard/debt-health", label: t.sidebar.debtHealth, icon: "❤️‍🩹" },
    { href: "/dashboard/accounts", label: t.sidebar.accounts, icon: "💳" },
    { href: "/dashboard/workspaces", label: t.sidebar.workspaces, icon: "👥" },
    { href: "/dashboard/lending", label: t.sidebar.lending, icon: "🤝" },
    { href: "/dashboard/money-story", label: t.sidebar.moneyStory, icon: "📖" },
    { href: "/dashboard/fire-alarm", label: t.sidebar.fireAlarm, icon: "🚨" },
    { href: "/dashboard/subscriptions", label: t.sidebar.subscriptions, icon: "🔍" },
    { href: "/dashboard/goals", label: t.sidebar.goals, icon: "🎯" },
    { href: "/dashboard/affordability", label: t.sidebar.affordability, icon: "🧮" },
    { href: "/dashboard/what-if", label: t.sidebar.whatIf, icon: "🔀" },
  ];
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const items = useNavItems();

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}

      <div className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 dark:text-slate-600">
        <span className="text-base">💬</span>
        {t.sidebar.askFinwise}
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold dark:bg-slate-800">
          {t.sidebar.comingSoon}
        </span>
      </div>
    </nav>
  );
}

function UserMenu({ onLogout, loggingOut }: { onLogout: () => void; loggingOut: boolean }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => u && setUser(u));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-emerald-500"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-in absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {user && (
            <div className="border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-700">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <span className="text-base">🚪</span>
            {t.nav.logout}
          </button>
        </div>
      )}
    </div>
  );
}

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-white animate-fade-in-up dark:bg-slate-900">
            <div className="flex h-19 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="flex h-19 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <Logo />
        </div>
        <NavLinks />
      </aside>

      {/* Main column: shared header + page content, identical on every page */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-19 items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="lg:hidden">
              <Logo />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <UserMenu onLogout={handleLogout} loggingOut={loggingOut} />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
