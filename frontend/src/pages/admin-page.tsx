import { AlertTriangle, DatabaseZap, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  claimAdminRole,
  fetchBootstrapStatus,
  fetchIngestionLogs,
  resetMarketData,
  triggerSync
} from "../lib/api-client";
import { dateTime, pluralize, toDisplayLabel } from "../lib/formatters";
import { useAuth } from "../state/auth-context";
import type { IngestionLog, SyncResponse } from "../types/api";

function friendlySyncError(message: string): string {
  if (message.toLowerCase().includes("adzuna credentials missing")) {
    return "Primary source keys are missing. Curated public feeds were used instead.";
  }
  return message;
}

export function AdminPage() {
  const { user, refreshProfile } = useAuth();
  const [logs, setLogs] = useState<IngestionLog[]>([]);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [runningSync, setRunningSync] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");
  const [claimingAdmin, setClaimingAdmin] = useState(false);
  const [adminMissing, setAdminMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastLog = logs[0] ?? null;
  const completedRuns = useMemo(() => logs.filter((item) => item.status === "completed").length, [logs]);

  async function loadLogs() {
    setLoadingLogs(true);
    setError(null);
    try {
      const response = await fetchIngestionLogs();
      setLogs(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to load refresh history.");
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      loadLogs().catch(() => undefined);
      return;
    }

    setLoadingLogs(false);
    fetchBootstrapStatus()
      .then((response) => setAdminMissing(!response.has_admin))
      .catch(() => setAdminMissing(false));
  }, [user?.role]);

  async function handleSync() {
    setRunningSync(true);
    setError(null);
    try {
      const response = await triggerSync({
        country: "in",
        max_jobs: 1000,
        reset_existing: true
      });
      setSyncResult(response);
      if (response.status !== "success" && response.errors.length) {
        setError(friendlySyncError(response.errors[0]));
      }
      await loadLogs();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Refresh failed. Try again.");
    } finally {
      setRunningSync(false);
    }
  }

  async function claimAdmin() {
    setClaimingAdmin(true);
    setError(null);
    try {
      await claimAdminRole();
      await refreshProfile();
      await loadLogs();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not claim admin access.");
    } finally {
      setClaimingAdmin(false);
    }
  }

  async function handleReset() {
    if (resetConfirm.trim().toUpperCase() !== "RESET") {
      setError("Type RESET to confirm.");
      return;
    }

    setResetting(true);
    setError(null);
    try {
      const response = await resetMarketData();
      setSyncResult({
        status: "reset",
        jobs_processed: response.jobs_deleted,
        errors: [],
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString()
      });
      setResetConfirm("");
      await loadLogs();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Reset failed.");
    } finally {
      setResetting(false);
    }
  }

  if (user?.role !== "admin") {
    return (
      <section className="panel p-5 md:p-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin Only
        </div>
        <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Dataset Controls</h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          This page is for the person who manages data refresh and reset operations.
        </p>

        {adminMissing ? (
          <button onClick={claimAdmin} disabled={claimingAdmin} className="cta-btn mt-5 inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {claimingAdmin ? "Claiming..." : "Claim Admin Access"}
          </button>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 content-fade-in">
      <section className="panel p-5 md:p-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-800 dark:bg-brand-900/30 dark:text-brand-100">
          <DatabaseZap className="h-3.5 w-3.5" />
          Admin Tools
        </div>
        <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">Dataset Maintenance</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-200">Refresh loads India tech jobs. Reset clears jobs and logs.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="metric-surface p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Refresh Runs</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{logs.length}</p>
          </div>
          <div className="metric-surface p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Completed</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{completedRuns}</p>
          </div>
          <div className="metric-surface p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Last Refresh</p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{lastLog ? dateTime(lastLog.started_at) : "No refresh yet"}</p>
          </div>
        </div>

        {syncResult ? (
          <div className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:bg-[#132746] dark:text-slate-100">
            <p>
              Last Action: <span className="font-semibold capitalize">{syncResult.status}</span>
            </p>
            <p className="mt-1">Records Touched: <span className="font-semibold">{syncResult.jobs_processed}</span></p>
            {syncResult.errors[0] ? (
              <p className="mt-2 rounded-lg border border-amber-700/30 bg-amber-900/10 px-2 py-1.5 text-xs text-amber-700 dark:text-amber-200">{friendlySyncError(syncResult.errors[0])}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="panel p-5 md:p-6">
          <h4 className="section-title">Refresh India Dataset</h4>
          <p className="section-copy">Clears old jobs and rebuilds up to 1000 India tech listings.</p>
          <button className="cta-btn mt-5 inline-flex items-center gap-2" onClick={handleSync} disabled={runningSync}>
            <RefreshCw className={`h-4 w-4 ${runningSync ? "animate-spin" : ""}`} />
            {runningSync ? "Refreshing..." : "Refresh Dataset"}
          </button>
        </div>

        <div className="panel p-5 md:p-6">
          <h4 className="section-title">Reset Dataset</h4>
          <p className="section-copy">Removes all jobs and ingestion logs.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              className="input-base sm:w-48"
              placeholder="Type RESET"
              value={resetConfirm}
              onChange={(event) => setResetConfirm(event.target.value)}
            />
            <button className="subtle-btn inline-flex items-center justify-center gap-2" onClick={handleReset} disabled={resetting}>
              <Trash2 className="h-4 w-4" />
              {resetting ? "Resetting..." : "Reset Dataset"}
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </section>
      ) : null}

      <section className="panel p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="section-title">Refresh History</h4>
            <p className="section-copy">Recent runs with status and output count.</p>
          </div>
          <button className="subtle-btn inline-flex items-center gap-2" onClick={loadLogs}>
            <RefreshCw className="h-4 w-4" />
            Refresh History
          </button>
        </div>

        {loadingLogs ? (
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-[#132746]" />
            ))}
          </div>
        ) : logs.length ? (
          <div className="mt-5 grid gap-3">
            {logs.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-[#132746]/95">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                          item.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-100"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-100"
                        }`}
                      >
                        {toDisplayLabel(item.status)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-300">{dateTime(item.started_at)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-100">
                      Triggered by <span className="font-semibold">{item.triggered_by || "System"}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">Source: {toDisplayLabel(item.source)}</p>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-200 md:text-right">
                    <p className="font-semibold text-slate-900 dark:text-white">{pluralize(item.jobs_processed, "job")} processed</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{dateTime(item.ended_at)}</p>
                  </div>
                </div>

                {item.errors.length ? (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/30 dark:bg-amber-900/12 dark:text-amber-100">
                    {friendlySyncError(item.errors[0])}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
            No history yet.
          </div>
        )}
      </section>
    </div>
  );
}
