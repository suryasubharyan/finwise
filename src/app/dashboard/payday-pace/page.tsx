"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { PaydayBarChart } from "@/components/dashboard/charts/PaydayBarChart";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Pace = {
  cycleLengthDays: number;
  daysElapsed: number;
  daysRemaining: number;
  cycleBudget: number;
  spentSoFar: number;
  idealSpentSoFar: number;
  dailyAllowance: number;
  paceStatus: "ahead" | "on-track" | "under";
};

type Cycle =
  | { hasEnoughData: false }
  | {
      hasEnoughData: true;
      avgBurnPercent: number | null;
      history: { date: string; percent: number }[];
      currentCycle: {
        salaryDate: string;
        percentSpent: number;
        withinBurnWindow: boolean;
      };
    };

function formatINR(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

const STATUS_STYLE: Record<string, string> = {
  ahead: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  "on-track": "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  under: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
};

export default function PaydayPacePage() {
  const { t } = useLanguage();
  const [pace, setPace] = useState<Pace | null>(null);
  const [cycle, setCycle] = useState<Cycle | null>(null);

  useEffect(() => {
    fetch("/api/payday-pace")
      .then((r) => r.json())
      .then((d) => {
        setPace(d.pace);
        setCycle(d.cycle);
      });
  }, []);

  const s = t.dashboard.paydayPaceSection;

  return (
    <div className="animate-fade-in-up mx-auto max-w-3xl space-y-6">
      <PageHeader icon="🔥" title={s.title} description="Where you are in your salary cycle" />

      <p className="-mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {s.explainer}
      </p>

      {pace && (
        <Card>
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {s.dailyAllowance}
              </p>
              <p className="mt-1 text-4xl font-bold text-slate-900 dark:text-white">
                {formatINR(pace.dailyAllowance)}
                <span className="text-base font-medium text-slate-400 dark:text-slate-500">
                  {s.perDay}
                </span>
              </p>
              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[pace.paceStatus]}`}
              >
                {s.status[pace.paceStatus]}
              </span>
            </div>

            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {s.dayOf} {pace.daysElapsed} {s.ofDays} {pace.cycleLengthDays}
                </span>
                <span>{pace.daysRemaining} days left</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-slate-400 dark:bg-slate-600"
                  style={{ width: `${(pace.daysElapsed / pace.cycleLengthDays) * 100}%` }}
                />
              </div>

              <div className="mt-4 space-y-2">
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{s.spentSoFar}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatINR(pace.spentSoFar)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        pace.paceStatus === "ahead" ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (pace.spentSoFar / Math.max(1, pace.cycleBudget)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{s.idealPace}</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {formatINR(pace.idealSpentSoFar)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-slate-300 dark:bg-slate-600"
                      style={{
                        width: `${Math.min(100, (pace.idealSpentSoFar / Math.max(1, pace.cycleBudget)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {s.historyTitle}
        </h3>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">{s.historyDesc}</p>

        {cycle && cycle.hasEnoughData ? (
          <PaydayBarChart
            points={[
              ...cycle.history,
              { date: cycle.currentCycle.salaryDate, percent: cycle.currentCycle.percentSpent },
            ].map((p, i, arr) => ({ ...p, isCurrent: i === arr.length - 1 }))}
            avgPercent={cycle.avgBurnPercent}
          />
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{s.notEnoughData}</p>
        )}
      </Card>
    </div>
  );
}
