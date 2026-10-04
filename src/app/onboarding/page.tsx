"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/components/providers/LanguageProvider";

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [incomeSource, setIncomeSource] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [incomeIsFixed, setIncomeIsFixed] = useState(true);
  const [priority, setPriority] = useState("");

  function goNext() {
    setError(null);

    if (step === 1 && !incomeSource) {
      setError(t.onboarding.errorIncomeSource);
      return;
    }
    if (step === 2 && (!monthlyIncome || Number(monthlyIncome) <= 0)) {
      setError(t.onboarding.errorMonthlyIncome);
      return;
    }

    setStep((s) => s + 1);
  }

  function goBack() {
    setError(null);
    setStep((s) => s - 1);
  }

  async function handleFinish() {
    if (!priority) {
      setError(t.onboarding.errorPriority);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incomeSource,
        monthlyIncome: Number(monthlyIncome),
        incomeIsFixed,
        priority,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-12 dark:bg-slate-950 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--color-emerald-100),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--color-emerald-950),transparent)]" />

      <div className="absolute top-4 right-4 flex items-center gap-2 sm:top-6 sm:right-6">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <Card className="sm:p-8">
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{t.onboarding.stepLabels[step - 1]}</span>
              <span>
                {t.onboarding.stepOf} {step} {t.onboarding.of} {TOTAL_STEPS}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500 ease-out dark:bg-emerald-500"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600 animate-fade-in dark:bg-rose-500/10 dark:text-rose-400">
              {error}
            </p>
          )}

          <div key={step} className="animate-fade-in-up space-y-4">
            {step === 1 && (
              <>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {t.onboarding.aboutYouTitle}
                </h1>
                <Select
                  label={t.onboarding.incomeSourceLabel}
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                >
                  <option value="">{t.onboarding.selectPlaceholder}</option>
                  <option value="SALARY">{t.onboarding.incomeSource.SALARY}</option>
                  <option value="FREELANCE">
                    {t.onboarding.incomeSource.FREELANCE}
                  </option>
                  <option value="BUSINESS">
                    {t.onboarding.incomeSource.BUSINESS}
                  </option>
                  <option value="STUDENT">{t.onboarding.incomeSource.STUDENT}</option>
                  <option value="OTHER">{t.onboarding.incomeSource.OTHER}</option>
                </Select>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {t.onboarding.incomeTitle}
                </h1>
                <Input
                  label={t.onboarding.monthlyIncomeLabel}
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder={t.onboarding.monthlyIncomePlaceholder}
                />
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={incomeIsFixed}
                    onChange={(e) => setIncomeIsFixed(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {t.onboarding.incomeFixedLabel}
                </label>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {t.onboarding.priorityTitle}
                </h1>
                <Select
                  label={t.onboarding.priorityQuestion}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="">{t.onboarding.selectPlaceholder}</option>
                  <option value="SAVE_MORE">{t.onboarding.priority.SAVE_MORE}</option>
                  <option value="CONTROL_SPENDING">
                    {t.onboarding.priority.CONTROL_SPENDING}
                  </option>
                  <option value="PLAN_PURCHASE">
                    {t.onboarding.priority.PLAN_PURCHASE}
                  </option>
                  <option value="PAY_DEBT">{t.onboarding.priority.PAY_DEBT}</option>
                  <option value="EMERGENCY_FUND">
                    {t.onboarding.priority.EMERGENCY_FUND}
                  </option>
                  <option value="UNDERSTAND_FINANCES">
                    {t.onboarding.priority.UNDERSTAND_FINANCES}
                  </option>
                </Select>
              </>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            {step > 1 ? (
              <Button variant="secondary" onClick={goBack}>
                {t.onboarding.back}
              </Button>
            ) : (
              <span />
            )}

            {step < TOTAL_STEPS ? (
              <Button onClick={goNext}>{t.onboarding.next}</Button>
            ) : (
              <Button onClick={handleFinish} loading={loading}>
                {loading ? t.onboarding.saving : t.onboarding.finish}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
