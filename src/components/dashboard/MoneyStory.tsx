"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";

type MoneyStoryData = {
  totalThisMonth: number;
  categories: { categoryName: string; total: number; changePercent: number | null }[];
  headline: string;
};

const BAR_COLORS = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-teal-500",
];

export function MoneyStory() {
  const { t } = useLanguage();
  const [data, setData] = useState<MoneyStoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights/money-story")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t.dashboard.moneyStory.loading}
        </p>
      </Card>
    );
  }

  if (!data || data.categories.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t.dashboard.moneyStory.noData}</p>
      </Card>
    );
  }

  const maxTotal = Math.max(...data.categories.map((c) => c.total));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white shadow-sm dark:border-slate-800">
        <p className="text-xs font-medium text-slate-300">This month's spending</p>
        <p className="mt-1 text-3xl font-bold">₹{data.totalThisMonth.toLocaleString("en-IN")}</p>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-200">{data.headline}</p>
      </div>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
          Breakdown by category
        </h3>
        <div className="space-y-4">
          {data.categories.map((c, i) => (
            <div key={c.categoryName}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {c.categoryName}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ₹{c.total.toLocaleString("en-IN")}
                  </span>
                  {c.changePercent !== null && (
                    <span
                      className={`text-xs font-semibold ${
                        c.changePercent >= 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {c.changePercent >= 0 ? "+" : ""}
                      {c.changePercent}%
                    </span>
                  )}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]} transition-all duration-700`}
                  style={{ width: `${maxTotal > 0 ? (c.total / maxTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
