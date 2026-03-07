export function LoadingPanel({ rows = 4 }: { rows?: number }) {
  return (
    <div className="metric-surface p-5">
      <div className="h-5 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700"
          />
        ))}
      </div>
    </div>
  );
}
