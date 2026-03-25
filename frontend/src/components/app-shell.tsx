import {
  BarChart3,
  Brain,
  DatabaseZap,
  LogOut,
  Orbit,
  Menu,
  MoonStar,
  Search,
  SunMedium,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { InfoPopover } from "./ui/info-popover";
import { useTheme } from "../hooks/use-theme";
import { useAuth } from "../state/auth-context";

const navItems = [
  { label: "Market Overview", to: "/dashboard", icon: BarChart3 },
  { label: "Role Intelligence", to: "/roles", icon: Search },
  { label: "Skill Gap Analysis", to: "/skill-gap", icon: Brain }
];

const pageMeta: Record<string, { title: string; summary: string; help: string }> = {
  "/dashboard": {
    title: "Market Overview",
    summary: "Live demand, salary signals, remote split, and current listings in one place.",
    help:
      "This page summarizes the current job market dataset. It shows which skills appear most often, how many listings disclose salary, how remote-friendly the market looks, and how posting volume is moving."
  },
  "/roles": {
    title: "Role Intelligence",
    summary: "Search a title and see what the market is actually asking for right now.",
    help:
      "Use this page to inspect one role at a time. It narrows the dataset to matching titles and highlights the skills, locations, salary signal, and posting trend for that slice."
  },
  "/skill-gap": {
    title: "Skill Gap Analysis",
    summary: "Compare your current stack with what employers keep repeating in live listings.",
    help:
      "This page compares the skills you enter with the strongest repeated signals in current listings for the selected role. It is a benchmark against the market, not a resume score."
  },
  "/admin": {
    title: "Admin Tools",
    summary: "Admin-only page for refreshing the dataset and checking ingestion history.",
    help:
      "Only the person maintaining the dataset needs this page. Refresh dataset pulls fresh jobs from the configured sources. Reset clears stored jobs and logs so the analysis can start from a clean base."
  }
};

export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const visibleNav =
    user?.role === "admin"
      ? [...navItems, { label: "Admin Tools", to: "/admin", icon: DatabaseZap }]
      : navItems;
  const currentMeta = useMemo(
    () => pageMeta[location.pathname] ?? pageMeta["/dashboard"],
    [location.pathname]
  );

  return (
    <div className="app-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1360px] gap-3 p-2.5 sm:p-3 md:p-4 lg:gap-5 lg:p-5">
        {mobileMenuOpen ? (
          <button
            className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="close navigation overlay"
          />
        ) : null}

        <aside
          className={`panel fixed inset-y-2.5 left-2.5 z-40 w-[min(20rem,calc(100vw-1.25rem))] flex-col overflow-y-auto p-4 transition-transform duration-200 lg:sticky lg:top-5 lg:flex lg:h-[calc(100vh-2.5rem)] lg:w-72 ${
            mobileMenuOpen ? "flex translate-x-0" : "hidden -translate-x-[110%] lg:translate-x-0"
          }`}
        >
          <div className="mb-7 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between lg:hidden">
              <span className="text-xs uppercase tracking-[0.28em] text-slate-500">Browse</span>
              <button
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="close mobile menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-800 dark:border-brand-900/60 dark:bg-brand-900/20 dark:text-brand-100">
              <Orbit className="h-3.5 w-3.5" />
              TalentScope
            </div>
            <h1 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">Analytics Console</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              A compact view of hiring demand, salaries, skills, and current market movement.
            </p>
          </div>

          <nav className="space-y-2">
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-brand-600 text-white shadow"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={toggleTheme}
            className="mt-auto mb-3 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/70 dark:text-rose-300 dark:hover:bg-rose-950/50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>

        <main className="min-w-0 flex-1 space-y-3 pb-20 sm:space-y-4 lg:pb-0">
          <header className="panel flex flex-col gap-3 px-3.5 py-3.5 sm:px-4 md:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex items-start gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="mt-0.5 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-[11px]">
                    {currentMeta.title}
                  </p>
                  <InfoPopover title={currentMeta.title} content={currentMeta.help} />
                </div>
                <h2 className="mt-1 text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                  TalentScope Analytics
                </h2>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                  {currentMeta.summary}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-800/70 lg:min-w-[220px] lg:justify-end lg:bg-transparent lg:p-0">
              <div className="min-w-0 text-left lg:text-right">
                <p className="max-w-[9rem] truncate text-sm font-medium text-slate-700 dark:text-slate-300 lg:max-w-none">
                  {user?.full_name || user?.email}
                </p>
                <p className="max-w-[12rem] truncate text-[11px] text-slate-500 dark:text-slate-400 lg:max-w-none">
                  {user?.email}
                </p>
              </div>
              <span className="inline-block rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-800 dark:bg-accent-900/40 dark:text-accent-200">
                {user?.role}
              </span>
            </div>
          </header>

          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-2.5 bottom-2.5 z-20 lg:hidden">
        <div className="panel grid grid-cols-3 gap-1.5 px-2 py-2 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.85)]">
          {visibleNav.slice(0, 3).map((item) => (
            <NavLink
              key={`mobile-bottom-${item.to}`}
              to={item.to}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`
              }
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.label.replace(" Analysis", "").replace(" Overview", "")}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
