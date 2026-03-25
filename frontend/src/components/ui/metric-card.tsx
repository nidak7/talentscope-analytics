import { InfoPopover } from "./info-popover";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  emphasis?: "brand" | "accent" | "slate";
  info?: string;
};

export function MetricCard({ label, value, hint, emphasis = "slate", info }: MetricCardProps) {
  const ringClass =
    emphasis === "brand"
      ? "border-brand-100/80 dark:border-brand-900/50"
      : emphasis === "accent"
        ? "border-amber-100/80 dark:border-amber-900/40"
        : "border-slate-200/80 dark:border-slate-800";

  return (
    <div className={`metric-surface p-4 sm:p-5 ${ringClass}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">{label}</p>
        {info ? <InfoPopover content={info} title={label} /> : null}
      </div>
      <p className="mt-3 break-words text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">{hint}</p> : null}
    </div>
  );
}
