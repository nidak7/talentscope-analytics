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
    <div className="panel p-4 sm:p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h3 className="section-title">Recent Listings Behind the Analysis</h3>
          <p className="section-copy">
            These are the freshest records currently influencing the dashboard. Use the filter to inspect one role
            family without leaving the overview.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Showing {jobs.length} listing{jobs.length === 1 ? "" : "s"}
          </div>
          <input
            className="input-base w-full sm:w-72"
            placeholder="Filter by role title"
            value={titleFilter}
            onChange={(event) => onFilterChange(event.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : jobs.length ? (
        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {jobs.map((job) => (
            <article
              key={job.id}
              className="rounded-[1.15rem] border border-slate-200 bg-white/75 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900/72 dark:hover:border-brand-700"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="break-words text-base font-semibold text-slate-900 dark:text-white">{job.title}</h4>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          job.is_remote
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {job.is_remote ? "Remote-friendly" : "Onsite / hybrid"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {job.company || "Unknown company"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location || "Location not specified"}
                      </span>
                      <span>Posted {shortDate(job.posted_date)}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {salaryRange(job.salary_min, job.salary_max)}
                      </span>
                    </div>
                  </div>

                  {job.url ? (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 self-start rounded-lg bg-accent-100 px-3 py-1.5 text-xs font-semibold text-accent-800 transition hover:bg-accent-200 dark:bg-accent-900/40 dark:text-accent-100 dark:hover:bg-accent-900/60"
                    >
                      Open listing
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>

                <div className="border-t border-slate-200/80 pt-3 dark:border-slate-800/80">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Extracted skills
                  </p>
                  {job.skills.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.slice(0, 8).map((skill) => (
                        <span
                          key={`${job.id}-${skill}`}
                          className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-800 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-100"
                        >
                          <Sparkles className="mr-1 inline h-3 w-3" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No skills were extracted from this listing yet.
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
          No listings matched this filter. Try a broader title or refresh the dataset.
        </div>
      )}
    </div>
  );
}


