import {
  Area,
  AreaChart,
  CartesianGrid,
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
      <div className="panel p-5">
        <h3 className="section-title">Hiring Trend</h3>
        <p className="section-copy">
          No trend data yet. Sync new listings to populate the timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="section-title">Hiring Trend</h3>
          <p className="section-copy">Daily job-posting volume over the last 45 days.</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Count of listings by posting date</p>
      </div>
      <div className="mt-3 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5b78c1" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#5b78c1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              minTickGap={26}
              tickFormatter={formatTrendDate}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              labelFormatter={(value) => formatTrendDate(String(value))}
              formatter={(value: number) => [`${value} listings`, "Jobs posted"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#5b78c1"
              fill="url(#trendFill)"
              strokeWidth={2.5}
              activeDot={{ r: 4, fill: "#4561a8" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
