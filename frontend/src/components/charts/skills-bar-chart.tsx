import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { InfoPopover } from "../ui/info-popover";
import type { SkillCount } from "../../types/api";

export function SkillsBarChart({ data }: { data: SkillCount[] }) {
  const chartData = [...data].slice(0, 6);

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
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="section-title">Top In-Demand Skills</h3>
            <InfoPopover
              title="Top In-Demand Skills"
              content="Each bar shows how many analyzed job listings asked for that skill. Higher bars mean the skill appeared in more listings across the current dataset."
            />
          </div>
          <p className="section-copy">Skills that appeared most often across the analyzed job listings.</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Count of analyzed listings</p>
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 18, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.16} horizontal={false} />
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis
              type="category"
              dataKey="skill"
              width={118}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <Tooltip
              cursor={{ fill: "rgba(91, 120, 193, 0.08)" }}
              formatter={(value: number) => [`Seen in ${value} analyzed jobs`, "Current demand"]}
            />
            <Bar dataKey="count" fill="#5b78c1" radius={[0, 10, 10, 0]} maxBarSize={34}>
              <LabelList dataKey="count" position="right" fontSize={11} fill="#64748b" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
