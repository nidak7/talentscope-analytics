import { BarChart3, Brain, DatabaseZap, LogOut, MoonStar, Search, SunMedium } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../hooks/use-theme";
import { useAuth } from "../state/auth-context";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: BarChart3 },
  { label: "Role Search", to: "/roles", icon: Search },
  { label: "Skill Gap", to: "/skill-gap", icon: Brain },
  { label: "Admin", to: "/admin", icon: DatabaseZap }
];

export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <div className="app-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1300px] gap-4 p-4 md:p-6">
        <aside className="panel sticky top-4 hidden h-[calc(100vh-2rem)] w-64 flex-col p-4 lg:flex">
          <div className="mb-7 border-b border-slate-200 pb-4 dark:border-slate-800">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">TalentScope</p>
            <h1 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Analytics</h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-brand-600 text-white shadow"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
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
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/70 dark:text-rose-300 dark:hover:bg-rose-950/50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>

        <main className="w-full space-y-4">
          <header className="panel flex items-center justify-between px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">TalentScope Analytics</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live market intelligence from job data</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{user?.full_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role}</p>
            </div>
          </header>

          <Outlet />
        </main>
      </div>
    </div>
  );
}

