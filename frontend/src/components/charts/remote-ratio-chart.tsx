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
  const remoteShare = total ? Math.round((props.remote / total) * 100) : 0;
  if (total === 0) {
    return (
      <div className="panel p-5">
        <h3 className="section-title">Remote vs Onsite</h3>
        <p className="section-copy">
          Remote data is not available yet. Sync new listings to populate the split.
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="section-title">Remote vs Onsite</h3>
          <p className="section-copy">How current listings split between remote-friendly and location-bound work.</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{props.remote} remote-friendly listings</p>
      </div>
      <div className="mt-3 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="relative h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
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
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Remote share</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{remoteShare}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">of current jobs</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {data.map((item, idx) => (
            <div key={item.name} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                {item.name}
              </span>
              <span className="text-right">
                <span className="font-semibold">{item.value}</span>
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  {Math.round((item.value / total) * 100)}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
