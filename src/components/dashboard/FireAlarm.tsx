"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Alert = {
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  description: string;
};

const SEVERITY_BORDER: Record<string, string> = {
  INFO: "border-l-slate-300 dark:border-l-slate-700",
  WARNING: "border-l-amber-400",
  CRITICAL: "border-l-rose-500",
};

const SEVERITY_BADGE: Record<string, string> = {
  INFO: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  WARNING: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  CRITICAL: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
};

const SEVERITY_ICON: Record<string, string> = {
  INFO: "ℹ️",
  WARNING: "⚠️",
  CRITICAL: "🚨",
};

export function FireAlarm() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights/fire-alarm")
      .then((res) => res.json())
      .then((d) => {
        setAlerts(d.alerts ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">...</p>;
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white py-14 text-center dark:border-emerald-900/40 dark:from-emerald-500/5 dark:to-slate-900">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl dark:bg-emerald-500/15">
          ✅
        </div>
        <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          {t.dashboard.fireAlarm.noAlerts}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={`flex items-start gap-4 rounded-2xl border border-l-4 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 ${SEVERITY_BORDER[a.severity]}`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${SEVERITY_BADGE[a.severity]}`}
          >
            {SEVERITY_ICON[a.severity]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{a.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {a.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
