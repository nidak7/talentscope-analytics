import { useEffect, useMemo, useState } from "react";
import { fetchDashboard } from "../lib/api-client";
import { compactNumber } from "../lib/formatters";
import type { DashboardStats } from "../types/api";
import { HiringTrendChart } from "../components/charts/hiring-trend-chart";
import { RemoteRatioChart } from "../components/charts/remote-ratio-chart";
import { SalaryDistributionChart } from "../components/charts/salary-distribution-chart";
import { SkillsBarChart } from "../components/charts/skills-bar-chart";
import { MetricCard } from "../components/ui/metric-card";
import { LoadingPanel } from "../components/ui/loading-panel";

export function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchDashboard()
      .then((response) => {
        if (mounted) {
          setData(response);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err?.response?.data?.detail || "Unable to load dashboard");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const remoteShare = useMemo(() => {
    if (!data || data.total_jobs === 0) {
      return 0;
    }
    return Math.round((data.remote_ratio.remote / data.total_jobs) * 100);
  }, [data]);

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
    </div>
  );
}

