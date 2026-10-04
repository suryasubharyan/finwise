"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SemiGauge } from "@/components/dashboard/charts/SemiGauge";
import { useLanguage } from "@/components/providers/LanguageProvider";

type DebtHealth = {
  foirPercent: number;
  status: "healthy" | "caution" | "critical";
  totalRecurringObligations: number;
  breakdown: { type: string; amount: number }[];
};

const OBLIGATION_TYPES = ["RENT", "EMI", "LOAN", "CREDIT_CARD", "SUBSCRIPTION", "OTHER"] as const;

function formatINR(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function DebtHealthPage() {
  const { t } = useLanguage();
  const s = t.dashboard.debtHealthSection;

  const [data, setData] = useState<DebtHealth | null>(null);
  const [type, setType] = useState<string>("EMI");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/debt-health");
    setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/obligations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, amount: Number(amount), dueDate, recurring: true }),
    });

    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(json.error);
      return;
    }

    setAmount("");
    setDueDate("");
    await load();
  }

  return (
    <div className="animate-fade-in-up mx-auto max-w-3xl space-y-6">
      <PageHeader icon="❤️‍🩹" title={s.title} description={s.foirDesc} />

      {data && (
        <Card>
          <SemiGauge
            value={data.foirPercent}
            status={data.status}
            centerLabel={s.foirLabel}
            bottomLabel={s.foirFullName}
          />
          <p
            className={`mx-auto mt-3 w-fit rounded-full px-3 py-1 text-center text-xs font-semibold ${
              data.status === "healthy"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : data.status === "caution"
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
            }`}
          >
            {s.status[data.status]}
          </p>

          <p className="mx-auto mt-4 max-w-sm text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {s.explainer}
          </p>

          <h3 className="mt-6 mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            {s.breakdownTitle}
          </h3>
          {data.breakdown.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{s.noObligations}</p>
          ) : (
            <div className="space-y-2">
              {data.breakdown.map((b) => (
                <div key={b.type} className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    {s.type[b.type as keyof typeof s.type] ?? b.type}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatINR(b.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {error && (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </p>
      )}

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
          {s.addObligation}
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
          <Select label={s.typeLabel} value={type} onChange={(e) => setType(e.target.value)}>
            {OBLIGATION_TYPES.map((o) => (
              <option key={o} value={o}>
                {s.type[o]}
              </option>
            ))}
          </Select>
          <Input
            label={s.amountLabel}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            label={s.dueDateLabel}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
          <Button type="submit" loading={submitting} className="sm:col-span-3 sm:w-fit">
            {submitting ? s.adding : s.addButton}
          </Button>
        </form>
      </Card>
    </div>
  );
}
