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

export function HiringTrendChart({ data }: { data: TrendPoint[] }) {
  const isEmpty = !data.length || data.every((item) => item.count === 0);
  if (isEmpty) {
    return (
      <div className="panel p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Hiring Trend</h3>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          No trend data yet. Sync new listings to populate the timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Hiring Trend</h3>
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
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#5b78c1" fill="url(#trendFill)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
