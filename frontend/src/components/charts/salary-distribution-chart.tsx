import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SalaryBin } from "../../types/api";

const COLORS = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe"];

export function SalaryDistributionChart({ data }: { data: SalaryBin[] }) {
  return (
    <div className="panel p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Salary Distribution</h3>
      <div className="mt-3 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="band" innerRadius={66} outerRadius={92} label>
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

