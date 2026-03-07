import { ArrowUpRight, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HiringTrendChart } from "../components/charts/hiring-trend-chart";
import { LiveJobsList } from "../components/live-jobs-list";
import { RemoteRatioChart } from "../components/charts/remote-ratio-chart";
import { SalaryDistributionChart } from "../components/charts/salary-distribution-chart";
import { SkillsBarChart } from "../components/charts/skills-bar-chart";
import { LoadingPanel } from "../components/ui/loading-panel";
import { MetricCard } from "../components/ui/metric-card";
import { fetchDashboard, fetchLiveJobs, triggerBootstrapSync, triggerSync } from "../lib/api-client";
import { compactNumber } from "../lib/formatters";
import { useAuth } from "../state/auth-context";
import type { DashboardStats, LiveJob } from "../types/api";

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [liveJobs, setLiveJobs] = useState<LiveJob[]>([]);
  const [jobFilter, setJobFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "brand" | "rose"; message: string } | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetchDashboard();
      setError(null);
      setData(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to load market analysis");
    }
  }, []);

  const loadLiveJobs = useCallback(async (title?: string) => {
    setJobsLoading(true);
    try {
      const response = await fetchLiveJobs(8, title);
      setLiveJobs(response);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([loadDashboard(), loadLiveJobs()])
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [loadDashboard, loadLiveJobs]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadLiveJobs(jobFilter).catch(() => undefined);
    }, 320);

    return () => window.clearTimeout(timeoutId);
  }, [jobFilter, loadLiveJobs]);

  const remoteShare = useMemo(() => {
    if (!data || data.total_jobs === 0) {
      return 0;
    }
    return Math.round((data.remote_ratio.remote / data.total_jobs) * 100);
  }, [data]);

  const salaryCoverage = useMemo(() => {
    if (!data || data.total_jobs === 0) {
      return 0;
    }
    const disclosed = data.salary_distribution
      .filter((item) => item.band !== "Not disclosed")
      .reduce((sum, item) => sum + item.count, 0);
    return Math.round((disclosed / data.total_jobs) * 100);
  }, [data]);

  const leadSkill = data?.top_skills[0];
  const bestSalaryBand = useMemo(() => {
    if (!data) {
      return null;
    }
    return data.salary_distribution
      .filter((item) => item.band !== "Not disclosed")
      .sort((left, right) => right.count - left.count)[0] ?? null;
  }, [data]);

  const notableTitles = useMemo(
    () => Array.from(new Set(liveJobs.map((job) => job.title))).slice(0, 3),
    [liveJobs]
  );

  async function refreshAll() {
    setNotice(null);
    setLoading(true);
    await Promise.all([loadDashboard(), loadLiveJobs(jobFilter)]);
    setLoading(false);
  }

  async function runSyncNow() {
    setSyncing(true);
    setNotice(null);
    try {
      const result = user?.role === "admin" ? await triggerSync() : await triggerBootstrapSync();
      setNotice({
        tone: "brand",
        message: `Data update finished. ${result.jobs_processed} records were processed into the market snapshot.`
      });
      await Promise.all([loadDashboard(), loadLiveJobs(jobFilter)]);
    } catch (err: any) {
      setNotice({
        tone: "rose",
        message: err?.response?.data?.detail || "Sync failed. Check API connectivity."
      });
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          <LoadingPanel rows={4} />
          <LoadingPanel rows={5} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LoadingPanel rows={2} />
          <LoadingPanel rows={2} />
          <LoadingPanel rows={2} />
          <LoadingPanel rows={2} />
        </div>
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
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="panel p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-900/30 dark:text-brand-100">
                <Sparkles className="h-3.5 w-3.5" />
                Live market snapshot
              </span>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                Market Intelligence Dashboard
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                This view tracks where demand is moving: the skills showing up most often, how much salary data is
                available, how remote-heavy the market is, and which fresh listings are shaping those numbers.
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
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="metric-surface border-brand-100/80 p-4 dark:border-brand-900/40">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Top signal</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                {leadSkill ? leadSkill.skill : "Waiting for data"}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {leadSkill ? `${leadSkill.count} listings mention it.` : "Run an update to populate the dataset."}
              </p>
            </div>
            <div className="metric-surface border-amber-100/80 p-4 dark:border-amber-900/40">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Salary coverage</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{salaryCoverage}%</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {bestSalaryBand ? `Strongest disclosed band: ${bestSalaryBand.band}.` : "No salary bands yet."}
              </p>
            </div>
            <div className="metric-surface p-4 sm:col-span-2 xl:col-span-1">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Listings in view</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {notableTitles.length ? (
                  notableTitles.map((title) => (
                    <span
                      key={title}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {title}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400">Loading recent titles...</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <aside className="panel p-5 md:p-6">
          <h3 className="section-title">Reading the dashboard</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex gap-3">
              <ArrowUpRight className="mt-0.5 h-4 w-4 text-brand-600" />
              <span>The skill chart shows what keeps recurring across recent listings, not one-time mentions.</span>
            </li>
            <li className="flex gap-3">
              <ArrowUpRight className="mt-0.5 h-4 w-4 text-brand-600" />
              <span>The salary and remote charts give quick coverage checks before you trust a market slice.</span>
            </li>
            <li className="flex gap-3">
              <ArrowUpRight className="mt-0.5 h-4 w-4 text-brand-600" />
              <span>The live listings panel is there to make the analysis inspectable, not abstract.</span>
            </li>
          </ul>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Current dataset</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{compactNumber(data.total_jobs)}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              total listings currently shaping the analysis
            </p>
          </div>
        </aside>
      </section>

      {notice && (
        <section
          className={`panel p-4 text-sm ${
            notice.tone === "brand"
              ? "border-brand-200 bg-brand-50/70 text-brand-900 dark:border-brand-900 dark:bg-brand-900/20 dark:text-brand-100"
              : "border-rose-200 bg-rose-50/70 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100"
          }`}
        >
          {notice.message}
        </section>
      )}

      {data.total_jobs === 0 && (
        <section className="panel border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-100">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">No market data available yet.</p>
              <p className="mt-1">
                Click <span className="font-semibold">Update Data</span> to ingest live listings and populate the
                dashboard with skills, salaries, and hiring trends.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard 
          label="Job Listings Analyzed" 
          value={compactNumber(data.total_jobs)} 
          hint="Total records in database"
          emphasis="brand"
        />
        <MetricCard 
          label="Market Heat Score" 
          value={`${data.market_heat_score}/100`} 
          hint="Demand intensity indicator"
          emphasis="accent"
        />
        <MetricCard 
          label="Remote Work Ratio" 
          value={`${remoteShare}%`} 
          hint="Percentage of remote positions"
        />
        <MetricCard 
          label="Salary Coverage" 
          value={`${salaryCoverage}%`} 
          hint="Listings with salary data"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SkillsBarChart data={data.top_skills} />
        <HiringTrendChart data={data.hiring_trend} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SalaryDistributionChart data={data.salary_distribution} />
        <RemoteRatioChart {...data.remote_ratio} />
      </section>

      <section>
        <LiveJobsList
          jobs={liveJobs}
          loading={jobsLoading}
          titleFilter={jobFilter}
          onFilterChange={setJobFilter}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="metric-surface p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Remote share</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{remoteShare}%</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Remote-friendly listings in the current mix.</p>
        </div>
        <div className="metric-surface p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Lead skill</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{leadSkill?.skill || "N/A"}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {leadSkill ? `${leadSkill.count} mentions across the dataset.` : "No skill signal yet."}
          </p>
        </div>
        <div className="metric-surface p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Most useful salary band</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{bestSalaryBand?.band || "N/A"}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {bestSalaryBand ? `${bestSalaryBand.count} listings fell into this band.` : "Waiting on salary disclosures."}
          </p>
        </div>
      </section>
    </div>
  );
}
