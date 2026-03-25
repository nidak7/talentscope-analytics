import { ArrowUpRight, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HiringTrendChart } from "../components/charts/hiring-trend-chart";
import { InfoPopover } from "../components/ui/info-popover";
import { LoadingPanel } from "../components/ui/loading-panel";
import { fetchRoleIntelligence } from "../lib/api-client";
import { asCurrency, compactNumber, pluralize } from "../lib/formatters";
import type { RoleIntelligence } from "../types/api";

const presetRoles = ["data engineer", "backend developer", "devops engineer", "product manager"];

export function RoleSearchPage() {
  const [query, setQuery] = useState("data engineer");
  const [submittedQuery, setSubmittedQuery] = useState("data engineer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RoleIntelligence | null>(null);

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setError("Enter at least 2 characters for role title");
      return;
    }

    setLoading(true);
    setError(null);
    setSubmittedQuery(trimmed);
    try {
      const response = await fetchRoleIntelligence(trimmed);
      setResult(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load role intelligence");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch("data engineer").catch(() => undefined);
  }, [runSearch]);

  async function onSearch(event: React.FormEvent) {
    event.preventDefault();
    await runSearch(query);
  }

  const leadSkill = result?.top_skills[0];
  const leadLocation = result?.top_locations[0];
  const roundedHeat = result ? Math.round(result.market_heat_score) : 0;
  const insightBullets = useMemo(() => {
    if (!result || result.total_jobs === 0) {
      return [];
    }

    const bullets = [];
    if (leadSkill) {
      bullets.push(`${leadSkill.skill} is the strongest repeating skill signal for this role.`);
    }
    if (leadLocation) {
      bullets.push(`${leadLocation.skill} is the most active hiring location in the current slice.`);
    }
    if (result.salary.median) {
      bullets.push(`Median disclosed salary currently lands around ${asCurrency(result.salary.median)}.`);
    }
    return bullets.slice(0, 3);
  }, [leadLocation, leadSkill, result]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="panel p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-900/30 dark:text-brand-100">
              <Search className="h-3.5 w-3.5" />
              Role-level market read
            </span>
            <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">Role Intelligence</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Search a role title and get a focused read on demand: job count, salary signal, top skills, hiring
              locations, and the posting trend behind it.
            </p>
          </div>

          <form onSubmit={onSearch} className="grid w-full gap-3 xl:max-w-xl xl:grid-cols-[1fr_auto]">
            <input
              className="input-base"
              placeholder="Search role title (for example: Data Engineer)"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              minLength={2}
              required
            />
            <button type="submit" className="cta-btn min-w-[132px]">
              {loading ? "Analyzing..." : "Analyze Role"}
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {presetRoles.map((preset) => (
            <button
              key={preset}
              type="button"
              className="subtle-btn !rounded-full !px-3 !py-1.5 !text-xs"
              onClick={() => {
                setQuery(preset);
                runSearch(preset).catch(() => undefined);
              }}
            >
              {preset}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          <LoadingPanel rows={6} />
          <LoadingPanel rows={6} />
        </div>
      ) : null}

      {error ? (
        <div className="panel p-5 text-sm text-rose-700 dark:text-rose-300">{error}</div>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <section className="grid gap-3 sm:gap-4 xl:grid-cols-[1.25fr_0.95fr]">
            <div className="panel p-4 sm:p-5 md:p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Role snapshot</p>
              <h3 className="mt-2 break-words text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">{submittedQuery}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                This slice uses the current dataset to estimate how strong the market is for the role, which skills
                show up most often, and whether salary information is present often enough to trust.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="metric-surface p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Jobs found</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                    {compactNumber(result.total_jobs)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">matching jobs in the current dataset</p>
                </div>
                <div className="metric-surface p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Median salary</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                    {asCurrency(result.salary.median)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">based on jobs that disclosed pay</p>
                </div>
                <div className="metric-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Role activity</p>
                    <InfoPopover
                      title="Role activity"
                      content="For a role search, market heat is estimated from how many matching jobs exist, how remote-friendly they are, and whether the role has a stronger salary signal."
                    />
                  </div>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{roundedHeat}/100</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">quick read of role activity</p>
                </div>
                <div className="metric-surface p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Lead skill</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                    {leadSkill?.skill || "N/A"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {leadSkill ? `seen in ${pluralize(leadSkill.count, "matching job")}` : "no skill signal yet"}
                  </p>
                </div>
              </div>
            </div>

            <aside className="panel p-4 sm:p-5 md:p-6">
              <h3 className="section-title">What stands out</h3>
              {insightBullets.length ? (
                <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  {insightBullets.map((item) => (
                    <li key={item} className="flex gap-3">
                      <ArrowUpRight className="mt-0.5 h-4 w-4 text-brand-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  There is not enough data for this role yet. Try a broader title or refresh the dataset.
                </p>
              )}
            </aside>
          </section>

          <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
            <div className="panel p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <h3 className="section-title">Top Skills for this Role</h3>
                <InfoPopover
                  title="Top Skills for this Role"
                  content="These skills appeared most often in listings that matched the role title you searched for."
                />
              </div>
              <p className="section-copy">Skills repeated most often in matching listings.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {result.top_skills.length ? (
                  result.top_skills.map((item) => (
                    <div
                      key={item.skill}
                      className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-3 text-sm text-brand-900 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-100"
                    >
                      <p className="font-medium">{item.skill}</p>
                      <p className="mt-1 text-xs text-brand-800/80 dark:text-brand-100/80">
                        Seen in {pluralize(item.count, "matching job")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No skills captured for this role yet.</p>
                )}
              </div>
            </div>

            <div className="panel p-4 sm:p-5">
              <h3 className="section-title">Top Hiring Locations</h3>
              <p className="section-copy">Locations showing up most often for this role.</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {result.top_locations.length ? (
                  result.top_locations.map((item) => (
                    <li
                      key={item.skill}
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/80"
                    >
                      <div>
                        <p className="font-medium">{item.skill}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {pluralize(item.count, "matching job")}
                        </p>
                      </div>
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
            <div className="panel p-5 text-sm text-slate-600 dark:text-slate-300">
              No current listings matched <span className="font-semibold">{submittedQuery}</span>. Try a broader title
              like <span className="font-semibold">backend developer</span> or refresh the dataset.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
