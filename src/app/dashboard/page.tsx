"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Forecast } from "@/components/dashboard/Forecast";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Account = { currentBalance: string };
type Transaction = { amount: string; type: string; date: string };
type Pace = { dailyAllowance: number; paceStatus: "ahead" | "on-track" | "under" };
type Debt = { foirPercent: number; status: "healthy" | "caution" | "critical" };

function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

const CARD_HREFS = [
  "/dashboard/money-story",
  "/dashboard/fire-alarm",
  "/dashboard/subscriptions",
  "/dashboard/affordability",
  "/dashboard/what-if",
  null, // Ask Finwise — not built yet
];

export default function OverviewPage() {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [upcomingObligations, setUpcomingObligations] = useState(0);
  const [pace, setPace] = useState<Pace | null>(null);
  const [debt, setDebt] = useState<Debt | null>(null);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then(setAccounts);
    fetch("/api/transactions")
      .then((r) => r.json())
      .then(setTransactions);
    fetch("/api/forecast")
      .then((r) => r.json())
      .then((d) => setUpcomingObligations(d.upcomingObligations ?? 0));
    fetch("/api/payday-pace")
      .then((r) => r.json())
      .then((d) => setPace(d.pace));
    fetch("/api/debt-health")
      .then((r) => r.json())
      .then(setDebt);
  }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);

  const now = new Date();
  const thisMonthTxns = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const savingsThisMonth =
    thisMonthTxns
      .filter((t) => t.type === "CREDIT")
      .reduce((s, t) => s + Number(t.amount), 0) -
    thisMonthTxns
      .filter((t) => t.type === "DEBIT")
      .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="animate-fade-in-up mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {t.sidebar.overview}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/dashboard/payday-pace">
          <Card className="h-full hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                🔥 {t.sidebar.paydayPace}
              </p>
              {pace && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    pace.paceStatus === "ahead"
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                  }`}
                >
                  {t.dashboard.paydayPaceSection.status[pace.paceStatus]}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">
              {pace ? formatINR(pace.dailyAllowance) : "..."}
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                {t.dashboard.paydayPaceSection.perDay}
              </span>
            </p>
          </Card>
        </Link>

        <Link href="/dashboard/debt-health">
          <Card className="h-full hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                ❤️‍🩹 {t.sidebar.debtHealth}
              </p>
              {debt && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    debt.status === "healthy"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : debt.status === "caution"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                  }`}
                >
                  {t.dashboard.debtHealthSection.status[debt.status]}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">
              {debt ? `${debt.foirPercent}%` : "..."}
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                {" "}
                FOIR
              </span>
            </p>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.dashboard.statTotalBalance}
          </p>
          <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
            {formatINR(totalBalance)}
          </p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.dashboard.statSafeToSpend}
          </p>
          <p className="mt-1.5 text-lg font-bold text-emerald-600 dark:text-emerald-400 sm:text-xl">
            {formatINR(Math.max(0, totalBalance - upcomingObligations))}
          </p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.dashboard.statUpcomingObligations}
          </p>
          <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
            {formatINR(upcomingObligations)}
          </p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.dashboard.statSavingsThisMonth}
          </p>
          <p
            className={`mt-1.5 text-lg font-bold sm:text-xl ${
              savingsThisMonth >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatINR(savingsThisMonth)}
          </p>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t.home.featuresTitle}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.home.features.map((feature, i) => {
            const href = CARD_HREFS[i];
            const content = (
              <Card
                className={`h-full ${href ? "hover:-translate-y-1" : "opacity-60"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-xl dark:from-emerald-500/15 dark:to-emerald-500/5">
                    {feature.icon}
                  </div>
                  {!href && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {t.sidebar.comingSoon}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {feature.question}
                </p>
              </Card>
            );

            return href ? (
              <Link key={feature.title} href={href}>
                {content}
              </Link>
            ) : (
              <div key={feature.title}>{content}</div>
            );
          })}
        </div>
      </div>

      <Forecast />
    </div>
  );
}
