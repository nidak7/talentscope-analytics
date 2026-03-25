import { AlertTriangle, DatabaseZap, MapPinned, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  claimAdminRole,
  fetchBootstrapStatus,
  fetchIngestionLogs,
  resetMarketData,
  triggerSync
} from "../lib/api-client";
import { dateTime, pluralize } from "../lib/formatters";
import { useAuth } from "../state/auth-context";
import type { IngestionLog, SyncResponse } from "../types/api";
import { InfoPopover } from "../components/ui/info-popover";

export function AdminPage() {
  const { user, refreshProfile } = useAuth();
  const [logs, setLogs] = useState<IngestionLog[]>([]);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [runningSync, setRunningSync] = useState(false);
  const [runningIndiaSync, setRunningIndiaSync] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");
  const [claimingAdmin, setClaimingAdmin] = useState(false);
  const [adminMissing, setAdminMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastLog = logs[0] ?? null;
  const completedRuns = useMemo(
    () => logs.filter((item) => item.status === "completed").length,
    [logs]
  );

  async function loadLogs() {
    setLoadingLogs(true);
    setError(null);
    try {
      const response = await fetchIngestionLogs();
      setLogs(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to fetch ingestion history.");
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
      if (response.status !== "success" && response.errors.length) {
        setError(response.errors[0]);
      }
      await loadLogs();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Dataset refresh failed.");
    } finally {
      setRunningSync(false);
    }
  }

  async function handleIndiaSync() {
    setRunningIndiaSync(true);
    setError(null);
    try {
      const response = await triggerSync({
        country: "in",
        max_jobs: 1000,
        reset_existing: true
      });
      setSyncResult(response);
      if (response.status !== "success" && response.errors.length) {
        setError(response.errors[0]);
      }
      await loadLogs();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "India dataset refresh failed.");
    } finally {
      setRunningIndiaSync(false);
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
      <div className="grid gap-3 sm:gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="panel p-4 sm:p-5 md:p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin only
          </div>
          <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">This page maintains the dataset.</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Normal users do not need this page. It is for the person operating the app: refreshing the stored job
            listings, checking whether ingestion succeeded, and resetting the analysis when needed.
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

        <aside className="panel p-4 sm:p-5 md:p-6">
          <div className="flex items-center gap-2">
            <h4 className="section-title">What "refresh dataset" means</h4>
            <InfoPopover
              title="Refresh dataset"
              content="Refreshing the dataset pulls fresh job listings from the configured sources, extracts skills, and recalculates the dashboard. It is a maintenance action, not something a normal viewer needs to run."
            />
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>Pull fresh jobs from external sources.</li>
            <li>Update the dashboard, role intelligence, and skill gap views.</li>
            <li>Review ingestion history if something goes wrong.</li>
          </ul>
        </aside>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="grid gap-3 sm:gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-4 sm:p-5 md:p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-800 dark:bg-brand-900/30 dark:text-brand-100">
            <DatabaseZap className="h-3.5 w-3.5" />
            Admin tools
          </div>
          <div className="mt-4 flex items-start gap-2">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">Dataset maintenance</h3>
            <InfoPopover
              title="Who uses this page?"
              content="This page is for the admin or maintainer of the app. It controls the stored job dataset that powers the rest of TalentScope."
            />
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Refresh dataset pulls a fresh batch of jobs into the database. Reset dataset clears the stored jobs and
            ingestion logs so the analysis can start from scratch.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="metric-surface p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Refresh runs</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{logs.length}</p>
            </div>
            <div className="metric-surface p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Completed runs</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{completedRuns}</p>
            </div>
            <div className="metric-surface p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Last refresh</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                {lastLog ? dateTime(lastLog.started_at) : "No refresh yet"}
              </p>
            </div>
          </div>
        </div>

        <aside className="panel p-4 sm:p-5 md:p-6">
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
              {syncResult.errors[0] ? (
                <p className="mt-3 break-words text-xs text-amber-700 dark:text-amber-300">{syncResult.errors[0]}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No dataset action has been triggered in this session yet.
            </p>
          )}
        </aside>
      </section>

      <section className="grid gap-3 sm:gap-4 xl:grid-cols-3">
        <div className="panel p-4 sm:p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-700 dark:bg-brand-900/30 dark:text-brand-100">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="section-title">Refresh dataset</h4>
                <InfoPopover
                  title="Refresh dataset"
                  content="Runs the job ingestion pipeline, stores any new listings, extracts skills, and refreshes the market analysis used by the rest of the app."
                />
              </div>
              <p className="section-copy">
                Pull fresh job listings, extract skills, and refresh the market analysis.
              </p>
            </div>
          </div>
          <button className="cta-btn mt-5 inline-flex items-center gap-2" onClick={handleSync} disabled={runningSync}>
            <RefreshCw className={`h-4 w-4 ${runningSync ? "animate-spin" : ""}`} />
            {runningSync ? "Refreshing..." : "Refresh Dataset"}
          </button>
        </div>

        <div className="panel p-4 sm:p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
              <MapPinned className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="section-title">Build India dataset</h4>
                <InfoPopover
                  title="Build India dataset"
                  content="This clears the current jobs and tries to rebuild the dataset using India as the target country, up to 1000 jobs. It requires working Adzuna credentials because the public fallback feeds are not reliable for India-only data."
                />
              </div>
              <p className="section-copy">
                Clears the current jobs and attempts an India-only refresh, capped at 1000 jobs.
              </p>
            </div>
          </div>
          <button
            className="cta-btn mt-5 inline-flex items-center gap-2"
            onClick={handleIndiaSync}
            disabled={runningIndiaSync}
          >
            <MapPinned className="h-4 w-4" />
            {runningIndiaSync ? "Building India dataset..." : "Load India Jobs"}
          </button>
        </div>

        <div className="panel p-4 sm:p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="section-title">Reset dataset</h4>
                <InfoPopover
                  title="Reset dataset"
                  content="This deletes stored jobs and ingestion logs. Use it only when you intentionally want to clear the analysis and rebuild it from scratch."
                />
              </div>
              <p className="section-copy">
                Clears stored jobs and ingestion logs so the analysis can start fresh.
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
            <button
              className="subtle-btn inline-flex items-center justify-center gap-2"
              onClick={handleReset}
              disabled={resetting}
            >
              <Trash2 className="h-4 w-4" />
              {resetting ? "Resetting..." : "Reset Dataset"}
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

      <section className="panel p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h4 className="section-title">Refresh history</h4>
              <p className="section-copy">Recent dataset runs, who triggered them, and whether they finished cleanly.</p>
            </div>
            <InfoPopover
              title="Refresh history"
              content="Each card below is one refresh attempt. It records when the run started, who triggered it, how many jobs were processed, and any error message returned by the ingestion pipeline."
            />
          </div>
          <button className="subtle-btn inline-flex items-center gap-2" onClick={loadLogs}>
            <RefreshCw className="h-4 w-4" />
            Refresh history
          </button>
        </div>

        {loadingLogs ? (
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : logs.length ? (
          <div className="mt-5 grid gap-3">
            {logs.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/55">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                          item.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200"
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Started {dateTime(item.started_at)}
                      </span>
                    </div>
                    <p className="mt-2 break-all text-sm text-slate-600 dark:text-slate-300">
                      Triggered by <span className="font-medium text-slate-900 dark:text-white">{item.triggered_by || "system"}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Source: {item.source}</p>
                  </div>

                  <div className="text-sm text-slate-600 dark:text-slate-300 md:min-w-[10rem] md:text-right">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {pluralize(item.jobs_processed, "job")} processed
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Finished {dateTime(item.ended_at)}
                    </p>
                  </div>
                </div>

                {item.errors.length ? (
                  <div className="mt-4 break-words rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
                    {item.errors[0]}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No ingestion errors were recorded for this run.</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
            No refresh history yet. Run a dataset refresh to create the first entry.
          </div>
        )}
      </section>
    </div>
  );
}
