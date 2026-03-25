import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SalaryBin } from "../../types/api";

function shortenBand(value: string) {
  return value.length > 12 ? `${value.slice(0, 10)}...` : value;
}

export function SalaryDistributionChart({ data }: { data: SalaryBin[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const disclosedData = data.filter((item) => item.band !== "Not disclosed");
  const disclosedCount = disclosedData.reduce((sum, item) => sum + item.count, 0);
  const undisclosedCount = total - disclosedCount;
  const coverage = total ? Math.round((disclosedCount / total) * 100) : 0;
  const strongestBand = disclosedData.slice().sort((left, right) => right.count - left.count)[0] ?? null;

  if (total === 0) {
    return (
      <div className="panel p-4 sm:p-5">
        <h3 className="section-title">Salary Distribution</h3>
        <p className="section-copy">
          Salary data is not available yet. Sync more listings to enrich salary bands.
        </p>
      </div>
    );
  }

  if (!disclosedData.length) {
    return (
      <div className="panel p-4 sm:p-5">
        <h3 className="section-title">Salary Distribution</h3>
        <p className="section-copy">
          None of the current listings disclosed salary. The dataset still contains {total} analyzed jobs.
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-4 sm:p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="section-title">Salary Distribution</h3>
          <p className="section-copy">How disclosed salaries are spread across the analyzed job listings.</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {disclosedCount} of {total} analyzed jobs disclosed pay
        </p>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={disclosedData} layout="vertical" margin={{ top: 4, right: 18, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.16} horizontal={false} />
              <XAxis type="number" allowDecimals={false} hide />
              <YAxis
                type="category"
                dataKey="band"
                width={78}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                tickMargin={10}
                tickFormatter={shortenBand}
              />
              <Tooltip formatter={(value: number) => [`${value} analyzed jobs`, "Listings in this pay band"]} />
              <Bar dataKey="count" fill="#7f97d2" radius={[0, 10, 10, 0]} maxBarSize={34}>
                <LabelList dataKey="count" position="right" fontSize={11} fill="#64748b" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="metric-surface p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Salary shown</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{coverage}%</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {disclosedCount} of {total} analyzed jobs
            </p>
          </div>
          <div className="metric-surface p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Salary hidden</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{undisclosedCount}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              listings did not disclose pay
            </p>
          </div>
          <div className="metric-surface p-4 sm:col-span-2 xl:col-span-1">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Most common pay band</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
              {strongestBand?.band || "N/A"}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {strongestBand ? `${strongestBand.count} analyzed jobs fell into this range.` : "No dominant pay band yet."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
