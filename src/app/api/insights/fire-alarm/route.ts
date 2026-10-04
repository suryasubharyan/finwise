import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  getSafeToSpend,
  getMonthlyIncome,
  getCategorySpend,
  getCategoryAnomalies,
  startOfMonth,
  startOfNextMonth,
  startOfPreviousMonth,
} from "@/lib/finance";
import { getPaydayCycleAnalysis } from "@/lib/paydayCycle";

type Alert = {
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  description: string;
};

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.userId;
  const alerts: Alert[] = [];
  const now = new Date();

  // 1. Low balance forecast
  const [safeToSpend, monthlyIncome] = await Promise.all([
    getSafeToSpend(userId),
    getMonthlyIncome(userId),
  ]);

  if (monthlyIncome > 0 && safeToSpend < monthlyIncome * 0.15) {
    alerts.push({
      type: "LOW_BALANCE_FORECAST",
      severity: "WARNING",
      title: "Low balance forecast",
      description: `Your safe-to-spend amount (₹${safeToSpend.toLocaleString(
        "en-IN"
      )}) is below 15% of your monthly income, after accounting for upcoming obligations.`,
    });
  }

  // 2. Statistical anomaly detection — flag categories more than 1.5
  // standard deviations above their own historical mean, instead of a
  // fixed "+30% vs last month" rule.
  const thisMonthStart = startOfMonth(now);
  const nextMonthStart = startOfNextMonth(now);
  const lastMonthStart = startOfPreviousMonth(now);

  const anomalies = await getCategoryAnomalies(userId);

  if (anomalies.length > 0) {
    for (const a of anomalies.slice(0, 3)) {
      const pctAboveAvg =
        a.historicalMean > 0
          ? Math.round(((a.currentTotal - a.historicalMean) / a.historicalMean) * 100)
          : null;
      alerts.push({
        type: "UNUSUAL_SPENDING",
        severity: a.zScore >= 2.5 ? "CRITICAL" : "WARNING",
        title: `Unusual ${a.categoryName.toLowerCase()} spending`,
        description: `You spent ₹${a.currentTotal.toLocaleString("en-IN")} on ${a.categoryName.toLowerCase()} this month — your usual is around ₹${a.historicalMean.toLocaleString(
          "en-IN"
        )}${pctAboveAvg !== null ? ` (${pctAboveAvg}% higher than normal)` : ""}. This is well outside your typical pattern, so it's worth a quick look.`,
      });
    }
  } else {
    // Fallback for users without enough history yet: simple month-over-month check.
    const [currentSpend, previousSpend] = await Promise.all([
      getCategorySpend(userId, thisMonthStart, nextMonthStart),
      getCategorySpend(userId, lastMonthStart, thisMonthStart),
    ]);
    const currentTotal = currentSpend.reduce((s, c) => s + c.total, 0);
    const previousTotal = previousSpend.reduce((s, c) => s + c.total, 0);

    if (previousTotal > 0 && currentTotal > previousTotal * 1.3) {
      const pct = Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
      alerts.push({
        type: "UNUSUAL_SPENDING",
        severity: "WARNING",
        title: "Unusual spending this month",
        description: `Total spending is up ${pct}% compared to last month (₹${currentTotal.toLocaleString(
          "en-IN"
        )} vs ₹${previousTotal.toLocaleString("en-IN")}).`,
      });
    }
  }

  // 3. Possible duplicate transactions (same account, merchant, amount, date)
  const recentTransactions = await prisma.transaction.findMany({
    where: { account: { userId }, date: { gte: lastMonthStart } },
    orderBy: { date: "desc" },
  });

  const seen = new Map<string, number>();
  for (const txn of recentTransactions) {
    const key = `${txn.accountId}|${txn.merchant}|${txn.amount}|${txn.date.toDateString()}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }

  const duplicateCount = Array.from(seen.values()).filter((c) => c > 1).length;
  if (duplicateCount > 0) {
    alerts.push({
      type: "POSSIBLE_DUPLICATE",
      severity: "INFO",
      title: "Possible duplicate transactions",
      description: `Found ${duplicateCount} transaction(s) with the same merchant, amount, and date on the same account. Worth a quick check.`,
    });
  }

  // 4. Goal falling behind pace
  const goals = await prisma.goal.findMany({ where: { userId, targetDate: { not: null } } });
  for (const goal of goals) {
    if (!goal.targetDate) continue;
    const target = Number(goal.targetAmount);
    const current = Number(goal.currentAmount);
    if (target <= 0 || current >= target) continue;

    const totalDays = Math.max(
      1,
      (goal.targetDate.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const elapsedDays = Math.max(
      0,
      (now.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const expectedProgress = Math.min(1, elapsedDays / totalDays);
    const actualProgress = current / target;

    if (expectedProgress > 0.1 && actualProgress < expectedProgress - 0.15) {
      alerts.push({
        type: "GOAL_BEHIND_PACE",
        severity: "INFO",
        title: `"${goal.name}" is behind pace`,
        description: `You've saved ${Math.round(
          actualProgress * 100
        )}% of the target, but ${Math.round(
          expectedProgress * 100
        )}% of the time has passed.`,
      });
    }
  }

  // 5. Payday burn-rate — flag if this cycle's early spend is notably
  // higher than the user's own historical average.
  const paydayAnalysis = await getPaydayCycleAnalysis(userId);
  if (
    paydayAnalysis.hasEnoughData &&
    paydayAnalysis.avgBurnPercent !== null &&
    paydayAnalysis.currentCycle.withinBurnWindow &&
    paydayAnalysis.currentCycle.percentSpent > paydayAnalysis.avgBurnPercent + 15
  ) {
    alerts.push({
      type: "PAYDAY_BURN_RATE",
      severity: "WARNING",
      title: "Spending faster than usual after payday",
      description: `You've spent ${paydayAnalysis.currentCycle.percentSpent}% of your salary already, vs your usual ${paydayAnalysis.avgBurnPercent}% in the same window.`,
    });
  }

  return NextResponse.json({ alerts });
}
