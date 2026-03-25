import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { TrendPoint } from "../../types/api";

function formatTrendDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

export function HiringTrendChart({ data }: { data: TrendPoint[] }) {
  const isEmpty = !data.length || data.every((item) => item.count === 0);
  if (isEmpty) {
    return (
      <div className="panel p-4 sm:p-5">
        <h3 className="section-title">Hiring Trend</h3>
        <p className="section-copy">
          No trend data yet. Sync new listings to populate the timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-4 sm:p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="section-title">Hiring Trend</h3>
          <p className="section-copy">Daily posting volume across the current dataset.</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Jobs posted per day</p>
      </div>
      <div className="mt-3 h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.16} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              minTickGap={32}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatTrendDate}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={34} axisLine={false} tickLine={false} />
            <Tooltip
              labelFormatter={(value) => formatTrendDate(String(value))}
              formatter={(value: number) => [`${value} jobs posted`, "Daily count"]}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#5b78c1"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: "#4561a8" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
