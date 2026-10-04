import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  getTotalBalance,
  getUpcomingObligationsTotal,
  getMonthlyIncome,
  getSafeToSpend,
  getCategorySpend,
  startOfMonth,
  startOfNextMonth,
  startOfPreviousMonth,
} from "@/lib/finance";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.userId;
  const now = new Date();

  const [totalBalance, upcomingObligations, monthlyIncome, safeToSpend] =
    await Promise.all([
      getTotalBalance(userId),
      getUpcomingObligationsTotal(userId, 30),
      getMonthlyIncome(userId),
      getSafeToSpend(userId),
    ]);

  const recurringObligations = await prisma.obligation.findMany({
    where: { userId, recurring: true },
  });
  const monthlyRecurringTotal = recurringObligations.reduce(
    (sum, o) => sum + Number(o.amount),
    0
  );

  const lastMonthSpend = await getCategorySpend(
    userId,
    startOfPreviousMonth(now),
    startOfMonth(now)
  );
  const avgMonthlySpend = lastMonthSpend.reduce((sum, c) => sum + c.total, 0);

  const projection: { month: string; projectedBalance: number }[] = [];
  let runningBalance = totalBalance;
  for (let i = 1; i <= 3; i++) {
    runningBalance =
      runningBalance + monthlyIncome - monthlyRecurringTotal - avgMonthlySpend;
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    projection.push({
      month: monthDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      projectedBalance: Math.round(runningBalance),
    });
  }

  return NextResponse.json({
    totalBalance,
    safeToSpend,
    upcomingObligations,
    monthlyIncome,
    assumptions: {
      monthlyRecurringObligations: monthlyRecurringTotal,
      avgMonthlyDiscretionarySpend: Math.round(avgMonthlySpend),
      note: "Projection assumes recurring obligations repeat monthly and discretionary spending matches last month's total.",
    },
    projection,
  });
}
