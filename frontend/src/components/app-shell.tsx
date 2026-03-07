import {
  BarChart3,
  Brain,
  DatabaseZap,
  LogOut,
  Menu,
  MoonStar,
  Search,
  SunMedium,
  X
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../hooks/use-theme";
import { useAuth } from "../state/auth-context";

const navItems = [
  { label: "Market Overview", to: "/dashboard", icon: BarChart3 },
  { label: "Role Intelligence", to: "/roles", icon: Search },
  { label: "Skill Gap Analysis", to: "/skill-gap", icon: Brain }
];

export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const visibleNav =
    user?.role === "admin"
      ? [...navItems, { label: "Data Sync", to: "/admin", icon: DatabaseZap }]
      : navItems;

  return (
    <div className="app-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1300px] gap-4 p-4 md:p-6">
        {mobileMenuOpen ? (
          <button
            className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="close navigation overlay"
          />
        ) : null}

        <aside
          className={`panel fixed inset-y-4 left-4 z-40 w-72 flex-col p-4 transition-transform lg:sticky lg:top-4 lg:flex lg:h-[calc(100vh-2rem)] lg:w-64 ${
            mobileMenuOpen ? "flex translate-x-0" : "hidden -translate-x-[110%] lg:translate-x-0"
          }`}
        >
          <div className="mb-7 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between lg:hidden">
              <span className="text-xs uppercase tracking-[0.28em] text-slate-500">Navigation</span>
              <button
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="close mobile menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">TalentScope</p>
            <h1 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Market Intelligence</h1>
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

        <main className="w-full space-y-4">
          <header className="panel flex items-center justify-between px-4 py-4 md:px-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">TalentScope Analytics</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Job market analysis and insights</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{user?.full_name}</p>
              <span className="mt-1 inline-block rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-800 dark:bg-accent-900/40 dark:text-accent-200">
                {user?.role}
              </span>
            </div>
          </header>

          <section className="flex flex-wrap gap-2 lg:hidden">
            {visibleNav.map((item) => (
              <NavLink
                key={`mobile-chip-${item.to}`}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "bg-brand-600 text-white"
                      : "bg-white/85 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900/85 dark:text-slate-200 dark:ring-slate-700"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </section>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
