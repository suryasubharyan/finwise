import { prisma } from "@/lib/prisma";

export async function getTotalBalance(userId: string): Promise<number> {
  const accounts = await prisma.account.findMany({ where: { userId } });
  return accounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);
}

export async function getUpcomingObligationsTotal(
  userId: string,
  days = 30
): Promise<number> {
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const obligations = await prisma.obligation.findMany({
    where: { userId, dueDate: { gte: now, lte: until } },
  });

  return obligations.reduce((sum, o) => sum + Number(o.amount), 0);
}

export async function getMonthlyIncome(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.monthlyIncome ? Number(user.monthlyIncome) : 0;
}

export async function getSafeToSpend(userId: string): Promise<number> {
  const [balance, obligations] = await Promise.all([
    getTotalBalance(userId),
    getUpcomingObligationsTotal(userId, 30),
  ]);

  return Math.max(0, balance - obligations);
}

type CategorySpend = {
  categoryId: string | null;
  categoryName: string;
  total: number;
};

export async function getCategorySpend(
  userId: string,
  start: Date,
  end: Date
): Promise<CategorySpend[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      type: "DEBIT",
      date: { gte: start, lt: end },
      account: { userId },
    },
    include: { category: true },
  });

  const totals = new Map<string, CategorySpend>();

  for (const txn of transactions) {
    const key = txn.categoryId ?? "uncategorized";
    const name = txn.category?.name ?? "Uncategorized";
    const existing = totals.get(key);
    const amount = Number(txn.amount);

    if (existing) {
      existing.total += amount;
    } else {
      totals.set(key, { categoryId: txn.categoryId, categoryName: name, total: amount });
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.total - a.total);
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

type CategoryAnomaly = {
  categoryName: string;
  currentTotal: number;
  historicalMean: number;
  historicalStdDev: number;
  zScore: number;
};

/**
 * Compares this month's spend per category against the mean/std-dev of the
 * previous `lookbackMonths` months (a z-score), instead of a fixed "+30%"
 * threshold. Flags categories more than `zThreshold` standard deviations
 * above their own historical average — the same basic approach used in
 * real anomaly/fraud-detection systems, adapted per-category per-user.
 */
export async function getCategoryAnomalies(
  userId: string,
  zThreshold = 1.5,
  lookbackMonths = 4
): Promise<CategoryAnomaly[]> {
  const now = new Date();
  const monthlyTotals = new Map<string, number[]>();

  for (let i = lookbackMonths; i >= 1; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const spend = await getCategorySpend(userId, monthDate, nextMonthDate);

    for (const c of spend) {
      const arr = monthlyTotals.get(c.categoryName) ?? [];
      arr.push(c.total);
      monthlyTotals.set(c.categoryName, arr);
    }
    // Ensure every category seen so far has an entry for this month (0 if no spend)
    for (const [name, arr] of monthlyTotals) {
      if (arr.length < lookbackMonths - i + 1) arr.push(0);
      monthlyTotals.set(name, arr);
    }
  }

  const currentSpend = await getCategorySpend(userId, startOfMonth(now), startOfNextMonth(now));
  const anomalies: CategoryAnomaly[] = [];

  for (const c of currentSpend) {
    const history = monthlyTotals.get(c.categoryName);
    if (!history || history.length < 2) continue;

    const avg = mean(history);
    const sd = stdDev(history, avg);
    if (sd === 0) continue;

    const zScore = (c.total - avg) / sd;
    if (zScore >= zThreshold) {
      anomalies.push({
        categoryName: c.categoryName,
        currentTotal: c.total,
        historicalMean: Math.round(avg),
        historicalStdDev: Math.round(sd),
        zScore: Math.round(zScore * 100) / 100,
      });
    }
  }

  return anomalies.sort((a, b) => b.zScore - a.zScore);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfNextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export function startOfPreviousMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}
