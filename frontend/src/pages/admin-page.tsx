import { AlertTriangle, Clock3, DatabaseZap, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  claimAdminRole,
  fetchBootstrapStatus,
  fetchIngestionLogs,
  resetMarketData,
  triggerSync
} from "../lib/api-client";
import { dateTime } from "../lib/formatters";
import { useAuth } from "../state/auth-context";
import type { IngestionLog, SyncResponse } from "../types/api";

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
  const failedRuns = useMemo(
    () => logs.filter((item) => item.status !== "completed").length,
    [logs]
  );

  async function loadLogs() {
    setLoadingLogs(true);
    setError(null);
    try {
      const response = await fetchIngestionLogs();
      setLogs(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to fetch ingestion logs.");
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
      const response = await triggerSync();
      setSyncResult(response);
      await loadLogs();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Sync failed.");
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
      if (err?.response?.status === 404) {
        setError("Claim admin endpoint not found. Restart the backend with the latest code.");
      } else {
        setError(err?.response?.data?.detail || "Could not claim admin access.");
      }
    } finally {
      setClaimingAdmin(false);
    }
  }

  async function handleReset() {
    if (resetConfirm.trim().toUpperCase() !== "RESET") {
      setError("Type RESET to confirm data reset.");
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
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="panel p-5 md:p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Restricted area
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">Admin access is only for data operations.</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            TalentScope is mainly for analysts and users reading the market. This page only exists to refresh the
            dataset, inspect ingestion history, and reset the analysis baseline when needed.
          </p>

          {adminMissing ? (
            <button onClick={claimAdmin} disabled={claimingAdmin} className="cta-btn mt-6 inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {claimingAdmin ? "Claiming..." : "Claim Admin Access"}
            </button>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </div>
          ) : null}
        </section>

        <aside className="panel p-5 md:p-6">
          <h4 className="section-title">What this page does</h4>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>Run a fresh ingestion cycle from the configured job feeds.</li>
            <li>Check whether the last sync finished cleanly or produced errors.</li>
            <li>Reset jobs and ingestion logs when you want to start over.</li>
          </ul>
        </aside>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel p-5 md:p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-800 dark:bg-brand-900/30 dark:text-brand-100">
            <DatabaseZap className="h-3.5 w-3.5" />
            Data control
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">Keep the market snapshot current.</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            This is intentionally small. Sync pulls new listings into the analytics dataset. Reset clears the stored
            jobs and logs so you can rebuild the market view from a clean slate.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="metric-surface p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Sync runs</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{logs.length}</p>
            </div>
            <div className="metric-surface p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Failed runs</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{failedRuns}</p>
            </div>
            <div className="metric-surface p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Last update</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                {lastLog ? dateTime(lastLog.started_at) : "No sync yet"}
              </p>
            </div>
          </div>
        </div>

        <aside className="panel p-5 md:p-6">
          <h4 className="section-title">Last action</h4>
          {syncResult ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
              <p>
                Status: <span className="font-semibold capitalize">{syncResult.status}</span>
              </p>
              <p className="mt-2">
                Records touched: <span className="font-semibold">{syncResult.jobs_processed}</span>
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Started {dateTime(syncResult.started_at)}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No manual action has been triggered in this session yet.
            </p>
          )}
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-700 dark:bg-brand-900/30 dark:text-brand-100">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h4 className="section-title">Run live sync</h4>
              <p className="section-copy">
                Pull fresh job listings, extract skills, and refresh the dashboard metrics.
              </p>
            </div>
          </div>
          <button className="cta-btn mt-5 inline-flex items-center gap-2" onClick={handleSync} disabled={runningSync}>
            <RefreshCw className={`h-4 w-4 ${runningSync ? "animate-spin" : ""}`} />
            {runningSync ? "Syncing..." : "Update Data"}
          </button>
        </div>

        <div className="panel p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="section-title">Reset stored market data</h4>
              <p className="section-copy">
                Deletes stored jobs and ingestion logs. Use this when you want to rebuild the analysis from scratch.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="input-base sm:w-44"
              placeholder="Type RESET"
              value={resetConfirm}
              onChange={(event) => setResetConfirm(event.target.value)}
            />
            <button className="subtle-btn inline-flex items-center justify-center gap-2" onClick={handleReset} disabled={resetting}>
              <Trash2 className="h-4 w-4" />
              {resetting ? "Resetting..." : "Reset Data"}
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </section>
      ) : null}

      <section className="panel p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="section-title">Ingestion history</h4>
            <p className="section-copy">Recent sync runs, who triggered them, and whether they completed cleanly.</p>
          </div>
          <button className="subtle-btn inline-flex items-center gap-2" onClick={loadLogs}>
            <Clock3 className="h-4 w-4" />
            Refresh logs
          </button>
        </div>

        {loadingLogs ? (
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : logs.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.18em] text-slate-500 dark:border-slate-800">
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Started</th>
                  <th className="pb-3 pr-4">Ended</th>
                  <th className="pb-3 pr-4">Triggered by</th>
                  <th className="pb-3 pr-4">Jobs</th>
                  <th className="pb-3">Errors</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 align-top dark:border-slate-800">
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                          item.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{dateTime(item.started_at)}</td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{dateTime(item.ended_at)}</td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{item.triggered_by || "system"}</td>
                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">{item.jobs_processed}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{item.errors[0] || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
            No ingestion logs yet. Run a sync to create the first entry.
          </div>
        )}
      </section>
    </div>
  );
}
