type CyclePoint = {
  date: string;
  percent: number;
  isCurrent?: boolean;
};

export function PaydayBarChart({
  points,
  avgPercent,
}: {
  points: CyclePoint[];
  avgPercent: number | null;
}) {
  if (points.length === 0) return null;

  const maxVal = Math.max(...points.map((p) => p.percent), avgPercent ?? 0, 10) * 1.2;
  const chartHeight = 140;
  const barWidth = 28;
  const gap = 16;
  const width = points.length * (barWidth + gap) + gap;

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" /> Past cycles
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Current cycle
        </span>
        {avgPercent !== null && (
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-slate-400 dark:bg-slate-500" /> Your average
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${chartHeight + 24}`}
        className="w-full"
        style={{ maxWidth: width }}
      >
        {avgPercent !== null && (
          <line
            x1={0}
            x2={width}
            y1={chartHeight - (avgPercent / maxVal) * chartHeight}
            y2={chartHeight - (avgPercent / maxVal) * chartHeight}
            strokeDasharray="4 4"
            className="stroke-slate-300 dark:stroke-slate-600"
            strokeWidth={1.5}
          />
        )}

        {points.map((p, i) => {
          const barHeight = Math.max(2, (p.percent / maxVal) * chartHeight);
          const x = gap + i * (barWidth + gap);
          const y = chartHeight - barHeight;
          const d = new Date(p.date);
          const label = d.toLocaleDateString("en-IN", { month: "short" });

          return (
            <g key={p.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={6}
                className={p.isCurrent ? "fill-emerald-500" : "fill-slate-300 dark:fill-slate-700"}
              >
                <title>{`${label}: ${p.percent}% of salary spent in 4 days`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={chartHeight + 16}
                textAnchor="middle"
                className="fill-slate-400 text-[10px] dark:fill-slate-500"
              >
                {label}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="fill-slate-600 text-[10px] font-semibold dark:fill-slate-300"
              >
                {p.percent}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
