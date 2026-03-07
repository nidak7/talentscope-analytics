import { useState } from "react";
import { HiringTrendChart } from "../components/charts/hiring-trend-chart";
import { LoadingPanel } from "../components/ui/loading-panel";
import { fetchRoleIntelligence } from "../lib/api-client";
import { asCurrency, compactNumber } from "../lib/formatters";
import type { RoleIntelligence } from "../types/api";

export function RoleSearchPage() {
  const [query, setQuery] = useState("data engineer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RoleIntelligence | null>(null);

  async function onSearch(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) {
      setError("Enter at least 2 characters for role title");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchRoleIntelligence(query.trim());
      setResult(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load role intelligence");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="panel flex flex-col gap-3 p-5 md:flex-row">
        <input
          className="input-base"
          placeholder="Search role title (e.g., Data Engineer)"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          minLength={2}
          required
        />
        <button
          type="submit"
          className="cta-btn"
        >
          Analyze Role
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {["data engineer", "backend developer", "devops engineer", "product manager"].map((preset) => (
          <button
            key={preset}
            type="button"
            className="subtle-btn !rounded-full !px-3 !py-1.5 !text-xs"
            onClick={() => {
              setQuery(preset);
              setError(null);
            }}
          >
            {preset}
          </button>
        ))}
      </div>

      {loading ? <LoadingPanel rows={6} /> : null}

      {error ? (
        <div className="panel p-5 text-sm text-rose-700 dark:text-rose-300">{error}</div>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="panel p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Role</p>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{result.role}</p>
            </div>
            <div className="panel p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Jobs found</p>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {compactNumber(result.total_jobs)}
              </p>
            </div>
            <div className="panel p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Median salary</p>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {asCurrency(result.salary.median)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Range: {asCurrency(result.salary.min)} - {asCurrency(result.salary.max)}
              </p>
            </div>
            <div className="panel p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Market Heat Score</p>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {result.market_heat_score}/100
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="panel p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Top Skills for this Role</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.top_skills.length ? (
                  result.top_skills.map((item) => (
                    <span
                      key={item.skill}
                      className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-100"
                    >
                      {item.skill} ({item.count})
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No skills captured for this role yet.</p>
                )}
              </div>
            </div>
            <div className="panel p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Top Hiring Locations</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {result.top_locations.length ? (
                  result.top_locations.map((item) => (
                    <li
                      key={item.skill}
                      className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800"
                    >
                      <span>{item.skill}</span>
                      <span className="font-semibold">{item.count}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-500 dark:text-slate-400">No locations available yet.</li>
                )}
              </ul>
            </div>
          </div>

          <HiringTrendChart data={result.hiring_trend} />

          {!result.total_jobs ? (
            <div className="panel p-4 text-sm text-slate-600 dark:text-slate-300">
              No market data found for this role yet. Run a data sync and try again.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
