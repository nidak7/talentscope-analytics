import { ExternalLink, MapPin, Sparkles } from "lucide-react";
import { salaryRange, shortDate } from "../lib/formatters";
import type { LiveJob } from "../types/api";

type Props = {
  jobs: LiveJob[];
  loading?: boolean;
  titleFilter: string;
  onFilterChange: (value: string) => void;
};

export function LiveJobsList({ jobs, loading = false, titleFilter, onFilterChange }: Props) {
  return (
    <div className="panel p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Live Job Listings</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Latest ingested jobs with direct external links.
          </p>
        </div>
        <input
          className="input-base sm:w-64"
          placeholder="Filter by role title"
          value={titleFilter}
          onChange={(event) => onFilterChange(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : jobs.length ? (
        <div className="mt-4 space-y-3">
          {jobs.map((job) => (
            <article
              key={job.id}
              className="rounded-xl border border-slate-200 bg-white/70 p-4 transition hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-brand-700"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{job.title}</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {job.company || "Unknown company"} • {shortDate(job.posted_date)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    <MapPin className="mr-1 inline h-3.5 w-3.5" />
                    {job.location || "Location not specified"}
                    {job.is_remote ? " • Remote-friendly" : ""}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                    {salaryRange(job.salary_min, job.salary_max)}
                  </p>
                </div>
                {job.url ? (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-accent-100 px-3 py-1.5 text-xs font-semibold text-accent-800 transition hover:bg-accent-200 dark:bg-accent-900/40 dark:text-accent-100 dark:hover:bg-accent-900/60"
                  >
                    Open listing
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>

              {job.skills.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.skills.slice(0, 8).map((skill) => (
                    <span
                      key={`${job.id}-${skill}`}
                      className="rounded-full border border-brand-200 bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-800 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-100"
                    >
                      <Sparkles className="mr-1 inline h-3 w-3" />
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
          No jobs found for this filter yet. Trigger a sync from the Admin page.
        </div>
      )}
    </div>
  );
}

