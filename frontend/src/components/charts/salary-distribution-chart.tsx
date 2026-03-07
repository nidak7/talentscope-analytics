import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SalaryBin } from "../../types/api";

const COLORS = ["#5b78c1", "#7f97d2", "#a6bae1", "#c9d6ee", "#e1e8f5", "#ffb779"];

export function SalaryDistributionChart({ data }: { data: SalaryBin[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) {
    return (
      <div className="panel p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Salary Distribution</h3>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Salary data is not available yet. Sync more listings to enrich salary bands.
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Salary Distribution</h3>
      <div className="mt-3 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="band"
              innerRadius={58}
              outerRadius={92}
              label={({ name, percent }) =>
                percent && percent > 0.04 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
              }
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        </div>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {data.map((item, idx) => (
            <div key={item.band} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                {item.band}
              </span>
              <span className="font-semibold">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
