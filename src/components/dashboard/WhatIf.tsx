"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLanguage } from "@/components/providers/LanguageProvider";

type ScenarioResult = {
  buyNow: { remainingSavings: number };
  wait: { waitMonths: number; remainingSavingsAfterPurchase: number };
  emi: { emiMonths: number; monthlyPayment: number; remainingSavingsAfterFirstPayment: number };
};

function formatINR(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

export function WhatIf() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [waitMonths, setWaitMonths] = useState("2");
  const [emiMonths, setEmiMonths] = useState("6");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);

  async function handleCompare(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || "Untitled scenario",
        type: "PURCHASE_COMPARISON",
        price: Number(price),
        waitMonths: Number(waitMonths),
        emiMonths: Number(emiMonths),
      }),
    });

    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setResult(data.resultJson);
    }
  }

  const s = t.dashboard.whatIfSection;

  const options = result
    ? [
        {
          key: "buyNow",
          icon: "💵",
          label: s.buyNow,
          sub: null as string | null,
          value: result.buyNow.remainingSavings,
        },
        {
          key: "wait",
          icon: "⏳",
          label: `${s.waitOption} (${result.wait.waitMonths}mo)`,
          sub: null,
          value: result.wait.remainingSavingsAfterPurchase,
        },
        {
          key: "emi",
          icon: "📅",
          label: s.emiOption,
          sub: `${formatINR(result.emi.monthlyPayment)}/mo`,
          value: result.emi.remainingSavingsAfterFirstPayment,
        },
      ]
    : [];

  const bestKey = options.length
    ? options.reduce((a, b) => (b.value > a.value ? b : a)).key
    : null;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <form onSubmit={handleCompare} className="space-y-4">
          <Input
            label={s.nameLabel}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={s.namePlaceholder}
          />
          <Input
            label={s.priceLabel}
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={s.waitMonthsLabel}
              type="number"
              value={waitMonths}
              onChange={(e) => setWaitMonths(e.target.value)}
            />
            <Input
              label={s.emiMonthsLabel}
              type="number"
              value={emiMonths}
              onChange={(e) => setEmiMonths(e.target.value)}
            />
          </div>
          <Button type="submit" loading={loading} className="w-full">
            {loading ? s.comparing : s.compareButton}
          </Button>
        </form>
      </Card>

      <div className="space-y-3 lg:col-span-3">
        {!result ? (
          <Card className="flex h-full min-h-[280px] flex-col items-center justify-center border-dashed text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl dark:bg-slate-800">
              🔀
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Compare buying now, waiting, or EMI — side by side, instantly.
            </p>
          </Card>
        ) : (
          options.map((opt) => (
            <div
              key={opt.key}
              className={`flex items-center gap-4 rounded-2xl border p-4 transition-all sm:p-5 ${
                opt.key === bestKey
                  ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-white shadow-sm dark:border-emerald-900/40 dark:from-emerald-500/5 dark:to-slate-900"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xl dark:bg-slate-800">
                {opt.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {opt.label}
                  </p>
                  {opt.key === bestKey && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                      BEST
                    </span>
                  )}
                </div>
                {opt.sub && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{opt.sub}</p>
                )}
              </div>
              <p className="shrink-0 text-lg font-bold text-slate-900 dark:text-white">
                {formatINR(opt.value)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
