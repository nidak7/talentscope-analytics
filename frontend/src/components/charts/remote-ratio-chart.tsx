import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Props = {
  remote: number;
  onsite: number;
  hybrid_or_unknown: number;
};

const COLORS = ["#5b78c1", "#2f416b", "#ffb779"];

export function RemoteRatioChart(props: Props) {
  const data = [
    { name: "Remote", value: props.remote },
    { name: "Onsite", value: props.onsite },
    { name: "Hybrid/Unknown", value: props.hybrid_or_unknown }
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="panel p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Remote vs Onsite</h3>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Remote data is not available yet. Sync new listings to populate the split.
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Remote vs Onsite</h3>
      <div className="mt-3 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={90}
              label={({ name, percent }) =>
                percent && percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
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
            <div key={item.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                {item.name}
              </span>
              <span className="font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
