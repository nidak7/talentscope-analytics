import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SkillCount } from "../../types/api";

export function SkillsBarChart({ data }: { data: SkillCount[] }) {
  const chartData = [...data].slice(0, 8).reverse();

  if (!data.length) {
    return (
      <div className="panel p-5">
        <h3 className="section-title">Top In-Demand Skills</h3>
        <p className="section-copy">
          Not enough skill data yet. Run a sync to ingest live listings.
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="section-title">Top In-Demand Skills</h3>
          <p className="section-copy">Most repeated skills across the current listing set.</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Mentions across live listings</p>
      </div>
      <div className="mt-3 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 22, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis type="number" allowDecimals={false} fontSize={11} />
            <YAxis
              type="category"
              dataKey="skill"
              width={92}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(91, 120, 193, 0.08)" }}
              formatter={(value: number) => [`${value} mentions`, "Demand"]}
            />
            <Bar dataKey="count" fill="#5b78c1" radius={[0, 10, 10, 0]} maxBarSize={28}>
              <LabelList dataKey="count" position="right" fontSize={11} fill="#64748b" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
