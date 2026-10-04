import { prisma } from "@/lib/prisma";
import { getMonthlyIncome } from "@/lib/finance";

// FOIR = Fixed Obligation to Income Ratio — the same metric Indian lenders
// use to assess loan eligibility. <40% is generally considered healthy,
// 40-50% is cautionary, >50% is high-risk for most lenders.
const FOIR_HEALTHY_MAX = 40;
const FOIR_CAUTION_MAX = 50;

export async function getDebtHealth(userId: string) {
  const [monthlyIncome, obligations] = await Promise.all([
    getMonthlyIncome(userId),
    prisma.obligation.findMany({ where: { userId, recurring: true } }),
  ]);

  const breakdown = new Map<string, number>();
  let totalRecurring = 0;

  for (const o of obligations) {
    const amount = Number(o.amount);
    totalRecurring += amount;
    breakdown.set(o.type, (breakdown.get(o.type) ?? 0) + amount);
  }

  const foirPercent = monthlyIncome > 0 ? Math.round((totalRecurring / monthlyIncome) * 100) : 0;

  let status: "healthy" | "caution" | "critical" = "healthy";
  if (foirPercent > FOIR_CAUTION_MAX) status = "critical";
  else if (foirPercent > FOIR_HEALTHY_MAX) status = "caution";

  return {
    monthlyIncome,
    totalRecurringObligations: Math.round(totalRecurring),
    foirPercent,
    status,
    healthyMax: FOIR_HEALTHY_MAX,
    cautionMax: FOIR_CAUTION_MAX,
    breakdown: Array.from(breakdown.entries()).map(([type, amount]) => ({
      type,
      amount: Math.round(amount),
    })),
  };
}
