"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Result = {
  remainingSavingsAfterPurchase: number;
  emergencyReserveImpact: number;
  canMeetEmergencyReserve: boolean;
  monthlyEmi: number | null;
};

function formatINR(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

export function Affordability() {
  const { t } = useLanguage();
  const [price, setPrice] = useState("");
  const [method, setMethod] = useState<"CASH" | "EMI">("CASH");
  const [emiMonths, setEmiMonths] = useState("6");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/affordability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price: Number(price),
        paymentMethod: method,
        emiMonths: method === "EMI" ? Number(emiMonths) : undefined,
      }),
    });

    setLoading(false);
    if (res.ok) setResult(await res.json());
  }

  const s = t.dashboard.affordabilitySection;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <form onSubmit={handleCheck} className="space-y-4">
          <Input label={s.priceLabel} type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
          <Select label={s.methodLabel} value={method} onChange={(e) => setMethod(e.target.value as "CASH" | "EMI")}>
            <option value="CASH">{s.cash}</option>
            <option value="EMI">{s.emi}</option>
          </Select>
          {method === "EMI" && (
            <Input
              label={s.emiMonthsLabel}
              type="number"
              value={emiMonths}
              onChange={(e) => setEmiMonths(e.target.value)}
            />
          )}
          <Button type="submit" loading={loading} className="w-full">
            {loading ? s.checking : s.checkButton}
          </Button>
        </form>
      </Card>

      <div className="lg:col-span-3">
        {!result ? (
          <Card className="flex h-full min-h-[280px] flex-col items-center justify-center border-dashed text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl dark:bg-slate-800">
              🧮
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Enter a price to see the real effect on your savings and emergency reserve.
            </p>
          </Card>
        ) : (
          <div
            className={`h-full rounded-2xl border p-6 shadow-sm sm:p-8 ${
              result.canMeetEmergencyReserve
                ? "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-900/40 dark:from-emerald-500/5 dark:to-slate-900"
                : "border-amber-100 bg-gradient-to-br from-amber-50 to-white dark:border-amber-900/40 dark:from-amber-500/5 dark:to-slate-900"
            }`}
          >
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                result.canMeetEmergencyReserve
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
              }`}
            >
              {result.canMeetEmergencyReserve ? "✓" : "⚠"}{" "}
              {result.canMeetEmergencyReserve ? s.canMeet : s.cannotMeet}
            </span>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {result.monthlyEmi && (
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Monthly EMI
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">
                    {formatINR(result.monthlyEmi)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {s.remainingSavings}
                </p>
                <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatINR(result.remainingSavingsAfterPurchase)}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {s.emergencyImpact}
                </p>
                <p
                  className={`mt-0.5 text-xl font-bold ${
                    result.canMeetEmergencyReserve
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {formatINR(result.emergencyReserveImpact)}
                </p>
              </div>
            </div>
            <p className="mt-5 border-t border-slate-200/70 pt-4 text-xs leading-relaxed text-slate-400 dark:border-slate-700/50 dark:text-slate-500">
              We assume you should keep 3 months of income aside for emergencies. A positive
              number above means you&apos;d still have that cushion after this purchase; negative
              means you&apos;d be dipping into it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
