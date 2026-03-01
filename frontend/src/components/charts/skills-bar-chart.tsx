import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SkillCount } from "../../types/api";

export function SkillsBarChart({ data }: { data: SkillCount[] }) {
  return (
    <div className="panel p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Top In-Demand Skills</h3>
      <div className="mt-3 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="skill" interval={0} angle={-20} textAnchor="end" height={60} fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

