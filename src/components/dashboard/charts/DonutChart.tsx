export type DonutDatum = { label: string; value: number; color: string };

export function DonutChart({
  data,
  size = 168,
  strokeWidth = 24,
  selectedLabel,
  onSelect,
  centerLabel,
  centerValue,
}: {
  data: DonutDatum[];
  size?: number;
  strokeWidth?: number;
  selectedLabel?: string | null;
  onSelect?: (label: string) => void;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  if (total <= 0) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full border-4 border-dashed border-slate-100 dark:border-slate-800"
        style={{ width: size, height: size }}
      >
        <p className="px-4 text-center text-xs text-slate-400 dark:text-slate-500">No data yet</p>
      </div>
    );
  }

  let cumulative = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-100 dark:stroke-slate-800"
        />
        {data.map((d) => {
          const fraction = d.value / total;
          const segStart = cumulative;
          cumulative += fraction;
          const dimmed = selectedLabel != null && selectedLabel !== d.label;

          return (
            <circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${fraction * circumference} ${circumference}`}
              strokeDashoffset={-segStart * circumference}
              opacity={dimmed ? 0.25 : 1}
              className={onSelect ? "cursor-pointer transition-opacity duration-200" : "transition-opacity duration-200"}
              onClick={() => onSelect?.(d.label)}
            >
              <title>{d.label}</title>
            </circle>
          );
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <p className="text-lg font-bold text-slate-900 dark:text-white">{centerValue}</p>
          )}
          {centerLabel && (
            <p className="max-w-[80px] truncate text-[11px] text-slate-500 dark:text-slate-400">
              {centerLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function DonutLegend({
  data,
  total,
  selectedLabel,
  onSelect,
  formatValue,
}: {
  data: DonutDatum[];
  total: number;
  selectedLabel?: string | null;
  onSelect?: (label: string) => void;
  formatValue: (v: number) => string;
}) {
  return (
    <div className="flex-1 space-y-1.5">
      {data.map((d) => {
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
        const active = selectedLabel === d.label;
        return (
          <button
            key={d.label}
            type="button"
            onClick={() => onSelect?.(d.label)}
            disabled={!onSelect}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
              active
                ? "bg-slate-100 dark:bg-slate-800"
                : onSelect
                  ? "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  : ""
            }`}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
              {d.label}
            </span>
            <span className="shrink-0 text-xs font-semibold text-slate-900 dark:text-white">
              {formatValue(d.value)}
            </span>
            <span className="w-8 shrink-0 text-right text-[11px] text-slate-400 dark:text-slate-500">
              {pct}%
            </span>
          </button>
        );
      })}
    </div>
  );
}
