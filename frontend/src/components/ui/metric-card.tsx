type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  emphasis?: "brand" | "accent" | "slate";
};

export function MetricCard({ label, value, hint, emphasis = "slate" }: MetricCardProps) {
  const ringClass =
    emphasis === "brand"
      ? "border-brand-100/80 dark:border-brand-900/50"
      : emphasis === "accent"
        ? "border-amber-100/80 dark:border-amber-900/40"
        : "border-slate-200/80 dark:border-slate-800";

  return (
    <div className={`metric-surface p-5 ${ringClass}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}
