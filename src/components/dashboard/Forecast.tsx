"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";

type ForecastData = {
  safeToSpend: number;
  projection: { month: string; projectedBalance: number }[];
};

export function Forecast() {
  const { t } = useLanguage();
  const [data, setData] = useState<ForecastData | null>(null);

  useEffect(() => {
    fetch("/api/forecast")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) return null;

  return (
    <Card>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <span>📈</span> {t.dashboard.forecastSection.title}
      </h3>

      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {t.dashboard.forecastSection.safeToSpend}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
        ₹{data.safeToSpend.toLocaleString("en-IN")}
      </p>

      <p className="mt-4 mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        {t.dashboard.forecastSection.projection}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {data.projection.map((p) => (
          <div
            key={p.month}
            className="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/50"
          >
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{p.month}</p>
            <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
              ₹{(p.projectedBalance / 1000).toFixed(0)}k
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-snug text-slate-400 dark:text-slate-500">
        {t.dashboard.forecastSection.assumptionsNote}
      </p>
    </Card>
  );
}
