"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Loan = {
  id: string;
  personName: string;
  type: "LENT" | "BORROWED";
  amount: string;
  description: string | null;
  date: string;
  settled: boolean;
};

function formatINR(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function LendingPage() {
  const { t } = useLanguage();
  const s = t.dashboard.lendingSection;

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [personName, setPersonName] = useState("");
  const [type, setType] = useState<"LENT" | "BORROWED">("LENT");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/loans");
    setLoans(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personName,
        type,
        amount: Number(amount),
        date,
        description: description || undefined,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setPersonName("");
    setAmount("");
    setDate("");
    setDescription("");
    await load();
  }

  async function toggleSettled(loan: Loan) {
    await fetch(`/api/loans/${loan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settled: !loan.settled }),
    });
    await load();
  }

  const unsettled = loans.filter((l) => !l.settled);
  const youAreOwed = unsettled
    .filter((l) => l.type === "LENT")
    .reduce((sum, l) => sum + Number(l.amount), 0);
  const youOwe = unsettled
    .filter((l) => l.type === "BORROWED")
    .reduce((sum, l) => sum + Number(l.amount), 0);

  return (
    <div className="animate-fade-in-up mx-auto max-w-3xl space-y-6">
      <PageHeader icon="🤝" title={s.title} description={s.explainer} />

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {s.youAreOwed}
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatINR(youAreOwed)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.youOwe}</p>
          <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {formatINR(youOwe)}
          </p>
        </Card>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">...</p>
      ) : loans.length === 0 ? (
        <Card className="text-center text-sm text-slate-500 dark:text-slate-400">
          {s.noRecords}
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
          {loans.map((loan) => (
            <div
              key={loan.id}
              className={`flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6 ${loan.settled ? "opacity-50" : ""}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                  {loan.personName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(loan.date).toLocaleDateString("en-IN")}
                  {loan.description ? ` · ${loan.description}` : ""}
                </p>
              </div>
              <p
                className={`shrink-0 text-sm font-semibold ${
                  loan.type === "LENT"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {loan.type === "LENT" ? "+" : "-"}
                {formatINR(Number(loan.amount))}
              </p>
              <button
                onClick={() => toggleSettled(loan)}
                className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {loan.settled ? s.settled + " ✓" : s.markSettled}
              </button>
            </div>
          ))}
        </Card>
      )}

      {error && (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </p>
      )}

      <Card className="border-dashed">
        <p className="mb-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
          {s.addRecord}
        </p>
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <Input
            label={s.personLabel}
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder={s.personPlaceholder}
            required
          />
          <Select label={s.typeLabel} value={type} onChange={(e) => setType(e.target.value as "LENT" | "BORROWED")}>
            <option value="LENT">{s.lent}</option>
            <option value="BORROWED">{s.borrowed}</option>
          </Select>
          <Input
            label={s.amountLabel}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            label={s.dateLabel}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label={s.descriptionLabel}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button type="submit" loading={submitting} className="sm:col-span-2 lg:col-span-5">
            {submitting ? s.adding : s.addButton}
          </Button>
        </form>
      </Card>
    </div>
  );
}
