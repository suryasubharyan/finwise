"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Subscription = {
  id: string;
  merchant: string;
  amount: string;
  frequency: string;
  status: "EXPECTED" | "IGNORED" | "INACTIVE";
};

const TILE_COLORS = [
  "from-emerald-400 to-teal-500",
  "from-indigo-400 to-violet-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-sky-400 to-blue-500",
];

function tileColor(merchant: string) {
  let hash = 0;
  for (const ch of merchant) hash = (hash * 31 + ch.charCodeAt(0)) % TILE_COLORS.length;
  return TILE_COLORS[hash];
}

export function Subscriptions() {
  const { t } = useLanguage();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/subscriptions");
    setSubs(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDetect() {
    setDetecting(true);
    await fetch("/api/subscriptions/detect", { method: "POST" });
    setDetecting(false);
    await load();
  }

  async function toggleStatus(sub: Subscription) {
    const next = sub.status === "IGNORED" ? "EXPECTED" : "IGNORED";
    await fetch(`/api/subscriptions/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    await load();
  }

  const s = t.dashboard.subscriptionsSection;
  const active = subs.filter((s) => s.status !== "IGNORED" && s.status !== "INACTIVE");
  const totalMonthly = active.reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white shadow-sm dark:border-slate-800 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-medium text-slate-300">
            {active.length} active · {s.annualized}
          </p>
          <p className="mt-1 text-3xl font-bold">
            ₹{(totalMonthly * 12).toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-slate-300">₹{totalMonthly.toLocaleString("en-IN")}/month</p>
        </div>
        <Button variant="secondary" onClick={handleDetect} loading={detecting} className="shrink-0">
          {detecting ? s.detecting : s.detectButton}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">...</p>
      ) : subs.length === 0 ? (
        <Card className="text-center text-sm text-slate-500 dark:text-slate-400">
          {s.noSubscriptions}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subs.map((sub) => (
            <Card
              key={sub.id}
              className={`hover:-translate-y-0.5 ${sub.status === "IGNORED" ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white ${tileColor(sub.merchant)}`}
                >
                  {sub.merchant.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {sub.merchant}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ₹{Number(sub.amount).toLocaleString("en-IN")}/{sub.frequency.toLowerCase()}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  ₹{(Number(sub.amount) * 12).toLocaleString("en-IN")} {s.annualized}
                </p>
                <button
                  onClick={() => toggleStatus(sub)}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  {sub.status === "IGNORED" ? s.reactivateButton : s.ignoreButton}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
