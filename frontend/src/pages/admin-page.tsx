import { useEffect, useState } from "react";
import {
  claimAdminRole,
  fetchBootstrapStatus,
  fetchIngestionLogs,
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
  const [claimingAdmin, setClaimingAdmin] = useState(false);
  const [adminMissing, setAdminMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLogs() {
    setLoadingLogs(true);
    setError(null);
    try {
      const response = await fetchIngestionLogs();
      setLogs(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to fetch ingestion logs");
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      loadLogs();
    } else {
      fetchBootstrapStatus()
        .then((response) => setAdminMissing(!response.has_admin))
        .catch(() => setAdminMissing(false));
    }
  }, [user?.role]);

  async function handleSync() {
    setRunningSync(true);
    setError(null);
    try {
      const response = await triggerSync();
      setSyncResult(response);
      await loadLogs();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Sync failed");
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
      setError(err?.response?.data?.detail || "Could not claim admin role");
    } finally {
      setClaimingAdmin(false);
    }
  }

  if (user?.role !== "admin") {
    return (
      <div className="panel p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Admin controls</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Your account does not have admin access.
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Use the first account created in a fresh database, or create an admin via `/api/v1/auth/seed-admin`.
        </p>
        {adminMissing ? (
          <button onClick={claimAdmin} disabled={claimingAdmin} className="cta-btn mt-4">
            {claimingAdmin ? "Claiming..." : "Claim Admin Role"}
          </button>
        ) : null}
        {error ? <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="panel flex flex-col items-start gap-3 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Data Sync Controls</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Trigger a manual ingestion from Adzuna and refresh analytics.
          </p>
        </div>
        <button className="cta-btn" onClick={handleSync} disabled={runningSync}>
          {runningSync ? "Syncing..." : "Run Sync Now"}
        </button>
      </div>

      <div className="flex justify-end">
        <button className="subtle-btn" onClick={loadLogs}>
          Refresh Logs
        </button>
      </div>

      {syncResult ? (
        <div className="panel p-5 text-sm text-slate-700 dark:text-slate-300">
          Last manual sync: <span className="font-semibold">{syncResult.status}</span>,{" "}
          {syncResult.jobs_processed} jobs processed.
        </div>
      ) : null}

      {error ? <div className="panel p-5 text-sm text-rose-700 dark:text-rose-300">{error}</div> : null}

      <div className="panel p-5">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Ingestion Logs</h4>
        {loadingLogs ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading logs...</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Started</th>
                  <th className="pb-2">Ended</th>
                  <th className="pb-2">Triggered By</th>
                  <th className="pb-2">Jobs</th>
                  <th className="pb-2">Errors</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 capitalize">{item.status}</td>
                    <td className="py-2">{dateTime(item.started_at)}</td>
                    <td className="py-2">{dateTime(item.ended_at)}</td>
                    <td className="py-2">{item.triggered_by || "system"}</td>
                    <td className="py-2">{item.jobs_processed}</td>
                    <td className="py-2">{item.errors.length ? item.errors[0] : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

