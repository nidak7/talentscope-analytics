import { ArrowRight, BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchBootstrapStatus } from "../lib/api-client";
import { useAuth } from "../state/auth-context";
import type { BootstrapStatus } from "../types/api";

type Mode = "login" | "signup";

const introPoints = [
  "Track in-demand skills from live listings.",
  "See salary and remote trends in one place.",
  "Compare any role in seconds."
];

function validateCredentials(mode: Mode, fullName: string, email: string, password: string): string | null {
  if (mode === "signup" && fullName.trim().length < 2) {
    return "Full name must have at least 2 characters.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.trim())) {
    return "Enter a valid email address.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include uppercase, lowercase, and a number.";
  }

  return null;
}

export function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<BootstrapStatus | null>(null);

  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = (location.state as { from?: string } | undefined)?.from || "/dashboard";

  useEffect(() => {
    fetchBootstrapStatus()
      .then((response) => setStatus(response))
      .catch(() => setStatus(null));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const validationError = validateCredentials(mode, fullName, email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        await signup(fullName.trim(), email.trim().toLowerCase(), password);
      } else {
        await login(email.trim().toLowerCase(), password);
      }
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-bg flex min-h-screen items-center justify-center p-4 md:p-6">
      <div className="grid w-full max-w-[460px] overflow-hidden rounded-[1.8rem] border border-white/80 bg-white/92 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800/90 dark:bg-slate-950/78 lg:max-w-5xl lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 px-8 py-10 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(91,120,193,0.4),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,183,121,0.18),transparent_30%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
              <Sparkles className="h-3.5 w-3.5" />
              TalentScope
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">Market Intelligence</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Track what hiring teams are asking for in India: skills, salary patterns, and role demand.
            </p>
            <div className="mt-8 space-y-3">
              {introPoints.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/6 p-4">
              <BarChart3 className="h-4 w-4 text-brand-300" />
              <p className="mt-2 text-sm font-semibold">Built for fast decisions</p>
              <p className="mt-1 text-xs text-slate-300">Clean charts. Clear signals. No noisy job board clutter.</p>
            </div>
          </div>
        </section>

        <section className="px-5 py-6 sm:px-7 sm:py-7 lg:px-10 lg:py-9">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-800 dark:border-brand-900/50 dark:bg-brand-900/20 dark:text-brand-100 lg:hidden">
            <Sparkles className="h-3.5 w-3.5" />
            TalentScope
          </div>

          <h2 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {mode === "login" ? "Sign in to continue." : "Create your account to start analyzing the market."}
          </p>

          {status?.first_user_will_be_admin ? (
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-900 dark:border-brand-900/60 dark:bg-brand-900/20 dark:text-brand-100">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>First signup gets Admin access.</span>
              </div>
            </div>
          ) : null}

          <div className="mt-5 inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              className={`rounded-lg px-4 py-2 text-sm transition ${
                mode === "login"
                  ? "bg-white font-semibold text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
              onClick={() => setMode("login")}
              type="button"
            >
              Login
            </button>
            <button
              className={`rounded-lg px-4 py-2 text-sm transition ${
                mode === "signup"
                  ? "bg-white font-semibold text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
              onClick={() => setMode("signup")}
              type="button"
            >
              Sign Up
            </button>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                  Full Name
                </label>
                <input
                  className="input-base"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </div>
            ) : null}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                Email
              </label>
              <input
                className="input-base"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                Password
              </label>
              <input
                className="input-base"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Use uppercase, lowercase, and a number.
              </p>
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                {error}
              </div>
            ) : null}

            <button className="cta-btn flex w-full items-center justify-center gap-2 py-3" type="submit" disabled={busy}>
              {busy ? "Please wait..." : mode === "login" ? "Access Dashboard" : "Create Account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
