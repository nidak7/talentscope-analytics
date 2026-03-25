type Props = {
  remote: number;
  onsite: number;
  hybrid_or_unknown: number;
};

export function RemoteRatioChart(props: Props) {
  const data = [
    { name: "Remote-friendly", value: props.remote, color: "bg-brand-500" },
    { name: "Onsite", value: props.onsite, color: "bg-brand-800" },
    { name: "Hybrid or unclear", value: props.hybrid_or_unknown, color: "bg-accent-300" }
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="panel p-4 sm:p-5">
        <h3 className="section-title">Remote vs Onsite</h3>
        <p className="section-copy">
          Remote data is not available yet. Sync new listings to populate the split.
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-4 sm:p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="section-title">Remote vs Onsite</h3>
          <p className="section-copy">How the current dataset splits between remote-friendly and location-bound work.</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{props.remote} remote-friendly jobs in the dataset</p>
      </div>

      <div className="mt-5">
        <div className="flex h-5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          {data.map((item) => {
            const width = total ? `${(item.value / total) * 100}%` : "0%";
            return (
              <div
                key={item.name}
                className={`h-full ${item.color}`}
                style={{ width, minWidth: item.value ? "2.5rem" : 0 }}
                aria-label={`${item.name}: ${item.value} of ${total}`}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((item) => {
          const share = total ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.name} className="metric-surface p-4">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${item.color}`} />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</p>
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{share}% of analyzed jobs</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
