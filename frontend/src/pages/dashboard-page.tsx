import { RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HiringTrendChart } from "../components/charts/hiring-trend-chart";
import { RemoteRatioChart } from "../components/charts/remote-ratio-chart";
import { SalaryDistributionChart } from "../components/charts/salary-distribution-chart";
import { SkillsBarChart } from "../components/charts/skills-bar-chart";
import { LiveJobsList } from "../components/live-jobs-list";
import { LoadingPanel } from "../components/ui/loading-panel";
import { MetricCard } from "../components/ui/metric-card";
import { fetchDashboard, fetchLiveJobs, triggerSync } from "../lib/api-client";
import { compactNumber } from "../lib/formatters";
import { useAuth } from "../state/auth-context";
import type { DashboardStats, LiveJob } from "../types/api";

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<LiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetchDashboard();
      setData(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to load dashboard");
    }
  }, []);

  const loadJobs = useCallback(async (titleFilter?: string) => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const response = await fetchLiveJobs(24, titleFilter || undefined);
      setJobs(response);
    } catch (err: any) {
      setJobsError(err?.response?.data?.detail || "Failed to load live jobs");
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([loadDashboard(), loadJobs()])
      .catch(() => undefined)
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [loadDashboard, loadJobs]);

  useEffect(() => {
    const id = setTimeout(() => {
      loadJobs(filter).catch(() => undefined);
    }, 280);
    return () => clearTimeout(id);
  }, [filter, loadJobs]);

  const remoteShare = useMemo(() => {
    if (!data || data.total_jobs === 0) {
      return 0;
    }
    return Math.round((data.remote_ratio.remote / data.total_jobs) * 100);
  }, [data]);

  async function refreshAll() {
    setNotice(null);
    setLoading(true);
    await Promise.all([loadDashboard(), loadJobs(filter)]);
    setLoading(false);
  }

  async function runSyncNow() {
    if (user?.role !== "admin") {
      setNotice("Only admin users can run sync. First signup user is auto-admin.");
      return;
    }

    setSyncing(true);
    setNotice(null);
    try {
      const result = await triggerSync();
      setNotice(`Sync finished with status '${result.status}'. Jobs processed: ${result.jobs_processed}.`);
      await Promise.all([loadDashboard(), loadJobs(filter)]);
    } catch (err: any) {
      setNotice(err?.response?.data?.detail || "Sync failed. Check Adzuna credentials.");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4">
        <LoadingPanel rows={3} />
        <div className="grid gap-4 lg:grid-cols-2">
          <LoadingPanel rows={6} />
          <LoadingPanel rows={6} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="panel p-6">
        <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300">Dashboard unavailable</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{error || "Unknown error"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Market Overview</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive view of current demand, salaries, and remote trends.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="subtle-btn inline-flex items-center gap-1.5" onClick={refreshAll}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button className="cta-btn inline-flex items-center gap-1.5" onClick={runSyncNow} disabled={syncing}>
            <Sparkles className="h-3.5 w-3.5" />
            {syncing ? "Syncing..." : "Sync Live Data"}
          </button>
        </div>
      </section>

      {notice ? (
        <section className="panel border-brand-200 bg-brand-50/70 p-4 text-sm text-brand-900 dark:border-brand-900 dark:bg-brand-900/20 dark:text-brand-100">
          {notice}
        </section>
      ) : null}

      {data.total_jobs === 0 ? (
        <section className="panel border-accent-200 bg-accent-50/70 p-5 text-sm text-accent-900 dark:border-accent-900 dark:bg-accent-900/20 dark:text-accent-100">
          <p className="font-semibold">No job data yet.</p>
          <p className="mt-1">
            Run <span className="font-semibold">Sync Live Data</span> to ingest real listings. If sync fails, verify
            `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` in backend env.
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            First account created in this app is automatically admin.
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Jobs analyzed" value={compactNumber(data.total_jobs)} />
        <MetricCard label="Market Heat Score" value={`${data.market_heat_score}/100`} hint="Custom signal" />
        <MetricCard label="Remote share" value={`${remoteShare}%`} />
        <MetricCard label="Tracked skills" value={compactNumber(data.top_skills.length)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SkillsBarChart data={data.top_skills} />
        <HiringTrendChart data={data.hiring_trend} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SalaryDistributionChart data={data.salary_distribution} />
        <RemoteRatioChart {...data.remote_ratio} />
      </section>

      {jobsError ? <section className="panel p-4 text-sm text-rose-700 dark:text-rose-300">{jobsError}</section> : null}

      <LiveJobsList jobs={jobs} loading={jobsLoading} titleFilter={filter} onFilterChange={setFilter} />
    </div>
  );
}
