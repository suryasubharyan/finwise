"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CircleProgress } from "@/components/dashboard/charts/CircleProgress";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Goal = {
  id: string;
  name: string;
  category: string;
  targetAmount: string;
  currentAmount: string;
};

const CATEGORIES = [
  "EMERGENCY_FUND",
  "TRAVEL",
  "CAR",
  "HOUSE",
  "EDUCATION",
  "INVESTMENT",
  "CUSTOM",
] as const;

const CATEGORY_ICON: Record<string, string> = {
  EMERGENCY_FUND: "🛟",
  TRAVEL: "✈️",
  CAR: "🚗",
  HOUSE: "🏡",
  EDUCATION: "🎓",
  INVESTMENT: "📈",
  CUSTOM: "⭐",
};

export function Goals() {
  const { t } = useLanguage();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("CUSTOM");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/goals");
    setGoals(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category,
        targetAmount: Number(targetAmount),
        currentAmount: currentAmount ? Number(currentAmount) : 0,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setName("");
    setTargetAmount("");
    setCurrentAmount("");
    await load();
  }

  const s = t.dashboard.goalsSection;

  return (
    <div className="space-y-5">
      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">...</p>
      ) : goals.length === 0 ? (
        <Card className="text-center text-sm text-slate-500 dark:text-slate-400">
          {s.noGoals}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const target = Number(g.targetAmount);
            const current = Number(g.currentAmount);
            const pct = target > 0 ? (current / target) * 100 : 0;
            return (
              <Card key={g.id} className="hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <CircleProgress percent={pct} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
                      <span>{CATEGORY_ICON[g.category] ?? "⭐"}</span> {g.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ₹{current.toLocaleString("en-IN")} / ₹{target.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </p>
      )}

      <Card className="border-dashed">
        <p className="mb-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
          {s.addGoal}
        </p>
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <Input
            label={s.nameLabel}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={s.namePlaceholder}
            required
          />
          <Select label={s.categoryLabel} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {s.category[c]}
              </option>
            ))}
          </Select>
          <Input
            label={s.targetLabel}
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
          <Input
            label={s.currentLabel}
            type="number"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
          />
          <Button type="submit" loading={submitting} className="sm:col-span-2 lg:col-span-4">
            {submitting ? s.adding : s.addButton}
          </Button>
        </form>
      </Card>
    </div>
  );
}
