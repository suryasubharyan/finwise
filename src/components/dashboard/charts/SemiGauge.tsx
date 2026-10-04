const STATUS_COLOR: Record<string, string> = {
  healthy: "#10b981", // emerald-500
  caution: "#f59e0b", // amber-500
  critical: "#f43f5e", // rose-500
};

export function SemiGauge({
  value,
  status,
  centerLabel,
  bottomLabel,
}: {
  value: number; // 0-100
  status: "healthy" | "caution" | "critical";
  centerLabel?: string;
  bottomLabel?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const r = 80;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  const color = STATUS_COLOR[status];

  return (
    <div className="relative mx-auto w-full max-w-[240px]">
      <svg viewBox="0 0 200 110" className="w-full overflow-visible">
        <path
          d="M 20 100 A 80 80 0 1 1 180 100"
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          className="stroke-slate-100 dark:stroke-slate-800"
        />
        <path
          d="M 20 100 A 80 80 0 1 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-x-0 top-[58%] -translate-y-1/2 text-center">
        <p className="text-3xl font-bold text-slate-900 dark:text-white">
          {Math.round(value)}
          <span className="text-lg">%</span>
        </p>
        {centerLabel && (
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            {centerLabel}
          </p>
        )}
      </div>
      {bottomLabel && (
        <p className="mt-1 text-center text-xs text-slate-400 dark:text-slate-500">
          {bottomLabel}
        </p>
      )}
    </div>
  );
}
