import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Props = {
  remote: number;
  onsite: number;
  hybrid_or_unknown: number;
};

const COLORS = ["#22c55e", "#0f172a", "#94a3b8"];

export function RemoteRatioChart(props: Props) {
  const data = [
    { name: "Remote", value: props.remote },
    { name: "Onsite", value: props.onsite },
    { name: "Hybrid/Unknown", value: props.hybrid_or_unknown }
  ];

  return (
    <div className="panel p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Remote vs Onsite</h3>
      <div className="mt-3 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={92} label>
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

