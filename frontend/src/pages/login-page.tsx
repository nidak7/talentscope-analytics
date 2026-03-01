import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchBootstrapStatus } from "../lib/api-client";
import { useAuth } from "../state/auth-context";
import type { BootstrapStatus } from "../types/api";

type Mode = "login" | "signup";

function validateCredentials(mode: Mode, fullName: string, email: string, password: string): string | null {
  if (mode === "signup" && fullName.trim().length < 2) {
    return "Full name must have at least 2 characters";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.trim())) {
    return "Enter a valid email address";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include uppercase, lowercase, and a number";
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
      setError(err?.response?.data?.detail || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-bg flex min-h-screen items-center justify-center p-4">
      <div className="panel w-full max-w-md p-7">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">TalentScope</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Analytics Platform</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Real-time job market intelligence powered by live listings.
        </p>

        {status?.first_user_will_be_admin ? (
          <p className="mt-4 inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-900 dark:border-brand-900 dark:bg-brand-900/30 dark:text-brand-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            First sign-up account becomes admin automatically.
          </p>
        ) : null}

        <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            className={`rounded-lg px-2 py-2 text-sm ${mode === "login" ? "bg-white font-semibold dark:bg-slate-700" : ""}`}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={`rounded-lg px-2 py-2 text-sm ${mode === "signup" ? "bg-white font-semibold dark:bg-slate-700" : ""}`}
            onClick={() => setMode("signup")}
            type="button"
          >
            Sign up
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <input
              className="input-base"
              placeholder="Full name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          ) : null}
          <input
            className="input-base"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="input-base"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Password rule: at least 8 chars with uppercase, lowercase, and number.
          </p>
          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </p>
          ) : null}
          <button className="cta-btn w-full py-2.5" type="submit" disabled={busy}>
            {busy ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

