import { RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HiringTrendChart } from "../components/charts/hiring-trend-chart";
import { RemoteRatioChart } from "../components/charts/remote-ratio-chart";
import { SalaryDistributionChart } from "../components/charts/salary-distribution-chart";
import { SkillsBarChart } from "../components/charts/skills-bar-chart";
import { LoadingPanel } from "../components/ui/loading-panel";
import { MetricCard } from "../components/ui/metric-card";
import { fetchDashboard, triggerBootstrapSync, triggerSync } from "../lib/api-client";
import { compactNumber } from "../lib/formatters";
import { useAuth } from "../state/auth-context";
import type { DashboardStats } from "../types/api";

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetchDashboard();
      setData(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to load market analysis");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadDashboard()
      .catch(() => undefined)
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [loadDashboard]);

  const remoteShare = useMemo(() => {
    if (!data || data.total_jobs === 0) {
      return 0;
    }
    return Math.round((data.remote_ratio.remote / data.total_jobs) * 100);
  }, [data]);

  async function refreshAll() {
    setNotice(null);
    setLoading(true);
    await loadDashboard();
    setLoading(false);
  }

  async function runSyncNow() {
    setSyncing(true);
    setNotice(null);
    try {
      const result = user?.role === "admin" ? await triggerSync() : await triggerBootstrapSync();
      setNotice(`Data sync completed. Records processed: ${result.jobs_processed}.`);
      await loadDashboard();
    } catch (err: any) {
      setNotice(err?.response?.data?.detail || "Sync failed. Check API connectivity.");
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
        <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300">Analysis unavailable</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{error || "Unknown error"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <section className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Market Intelligence Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time analysis of job market trends, skills demand, and hiring patterns.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="subtle-btn inline-flex items-center gap-2" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button className="cta-btn inline-flex items-center gap-2" onClick={runSyncNow} disabled={syncing}>
            <Sparkles className="h-4 w-4" />
            {syncing ? "Updating..." : "Update Data"}
          </button>
        </div>
      </section>

      {/* Notice Messages */}
      {notice && (
        <section className="panel border-brand-200 bg-brand-50/70 p-4 text-sm text-brand-900 dark:border-brand-900 dark:bg-brand-900/20 dark:text-brand-100">
          {notice}
        </section>
      )}

      {data.total_jobs === 0 && (
        <section className="panel border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-100">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">No market data available yet.</p>
              <p className="mt-1">Click <span className="font-semibold">Update Data</span> to fetch the latest job market information. This will analyze real job listings to build insights.</p>
              {user?.role !== "admin" && (
                <p className="mt-2 text-xs opacity-75">Note: Admin users can perform full data refresh. Regular users trigger initial data bootstrap.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard 
          label="Job Listings Analyzed" 
          value={compactNumber(data.total_jobs)} 
          hint="Total records in database"
        />
        <MetricCard 
          label="Market Heat Score" 
          value={`${data.market_heat_score}/100`} 
          hint="Demand intensity indicator"
        />
        <MetricCard 
          label="Remote Work Ratio" 
          value={`${remoteShare}%`} 
          hint="Percentage of remote positions"
        />
        <MetricCard 
          label="Skills Tracked" 
          value={compactNumber(data.top_skills.length)} 
          hint="Unique skills identified"
        />
      </section>

      {/* Charts Row 1 */}
      <section className="grid gap-4 xl:grid-cols-2">
        <SkillsBarChart data={data.top_skills} />
        <HiringTrendChart data={data.hiring_trend} />
      </section>

      {/* Charts Row 2 */}
      <section className="grid gap-4 xl:grid-cols-2">
        <SalaryDistributionChart data={data.salary_distribution} />
        <RemoteRatioChart {...data.remote_ratio} />
      </section>
    </div>
  );
}
