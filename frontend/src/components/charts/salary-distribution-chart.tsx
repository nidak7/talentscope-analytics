import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SalaryBin } from "../../types/api";

const COLORS = ["#5b78c1", "#7f97d2", "#a6bae1", "#c9d6ee", "#e1e8f5", "#ffb779"];

export function SalaryDistributionChart({ data }: { data: SalaryBin[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const disclosed = data
    .filter((item) => item.band !== "Not disclosed")
    .reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <div className="panel p-5">
        <h3 className="section-title">Salary Distribution</h3>
        <p className="section-copy">
          Salary data is not available yet. Sync more listings to enrich salary bands.
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="section-title">Salary Distribution</h3>
          <p className="section-copy">Salary bands from listings that expose compensation details.</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{disclosed} of {total} listings include salary</p>
      </div>
      <div className="mt-3 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="relative h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="band"
                innerRadius={62}
                outerRadius={94}
                paddingAngle={3}
                labelLine={false}
                stroke="none"
              >
                {data.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value} listings`, "Count"]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Disclosed</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              {Math.round((disclosed / total) * 100)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">salary coverage</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {data.map((item, idx) => (
            <div key={item.band} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                {item.band}
              </span>
              <span className="text-right">
                <span className="font-semibold">{item.count}</span>
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  {Math.round((item.count / total) * 100)}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
