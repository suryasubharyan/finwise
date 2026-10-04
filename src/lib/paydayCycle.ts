import { prisma } from "@/lib/prisma";
import { getMonthlyIncome, getUpcomingObligationsTotal } from "@/lib/finance";

const SALARY_AMOUNT_TOLERANCE = 0.2; // within 20% of declared monthly income
const BURN_WINDOW_DAYS = 4;

async function getSalaryCredits(userId: string) {
  const monthlyIncome = await getMonthlyIncome(userId);
  if (monthlyIncome <= 0) return [];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const credits = await prisma.transaction.findMany({
    where: {
      type: "CREDIT",
      date: { gte: sixMonthsAgo },
      account: { userId },
    },
    orderBy: { date: "asc" },
  });

  return credits.filter((txn) => {
    const amount = Number(txn.amount);
    const withinTolerance =
      Math.abs(amount - monthlyIncome) / monthlyIncome <= SALARY_AMOUNT_TOLERANCE;
    const looksLikeSalary = /salary|payroll|stipend/i.test(txn.merchant);
    return withinTolerance || looksLikeSalary;
  });
}

async function getSpendBetween(userId: string, start: Date, end: Date) {
  const transactions = await prisma.transaction.findMany({
    where: {
      type: "DEBIT",
      date: { gte: start, lt: end },
      account: { userId },
    },
  });
  return transactions.reduce((sum, t) => sum + Number(t.amount), 0);
}

export async function getPaydayCycleAnalysis(userId: string) {
  const salaryCredits = await getSalaryCredits(userId);

  if (salaryCredits.length < 1) {
    return { hasEnoughData: false as const };
  }

  // Historical completed cycles: burn rate in the first N days after each past salary
  const completedCycles = salaryCredits.slice(0, -1);
  const history: { date: string; salaryAmount: number; spentIn4Days: number; percent: number }[] =
    [];

  for (const credit of completedCycles) {
    const burnEnd = new Date(credit.date.getTime() + BURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const spent = await getSpendBetween(userId, credit.date, burnEnd);
    const amount = Number(credit.amount);
    history.push({
      date: credit.date.toISOString(),
      salaryAmount: amount,
      spentIn4Days: Math.round(spent),
      percent: amount > 0 ? Math.round((spent / amount) * 100) : 0,
    });
  }

  const avgBurnPercent =
    history.length > 0
      ? Math.round(history.reduce((s, h) => s + h.percent, 0) / history.length)
      : null;

  // Current (latest) cycle
  const latestSalary = salaryCredits[salaryCredits.length - 1];
  const now = new Date();
  const daysSinceSalary = Math.floor(
    (now.getTime() - latestSalary.date.getTime()) / (1000 * 60 * 60 * 24)
  );

  let currentCycleSpentIn4Days: number | null = null;
  if (daysSinceSalary >= BURN_WINDOW_DAYS) {
    const burnEnd = new Date(
      latestSalary.date.getTime() + BURN_WINDOW_DAYS * 24 * 60 * 60 * 1000
    );
    currentCycleSpentIn4Days = Math.round(
      await getSpendBetween(userId, latestSalary.date, burnEnd)
    );
  } else {
    currentCycleSpentIn4Days = Math.round(
      await getSpendBetween(userId, latestSalary.date, now)
    );
  }

  const latestAmount = Number(latestSalary.amount);
  const currentCyclePercent =
    latestAmount > 0 ? Math.round((currentCycleSpentIn4Days / latestAmount) * 100) : 0;

  return {
    hasEnoughData: true as const,
    avgBurnPercent,
    history: history.slice(-6),
    currentCycle: {
      salaryDate: latestSalary.date.toISOString(),
      salaryAmount: latestAmount,
      daysSinceSalary,
      spentSoFar: currentCycleSpentIn4Days,
      percentSpent: currentCyclePercent,
      withinBurnWindow: daysSinceSalary < BURN_WINDOW_DAYS,
    },
  };
}

export async function getDailyPace(userId: string) {
  const salaryCredits = await getSalaryCredits(userId);
  const now = new Date();

  let cycleStart: Date;
  let cycleLengthDays: number;

  if (salaryCredits.length > 0) {
    cycleStart = salaryCredits[salaryCredits.length - 1].date;
    if (salaryCredits.length >= 2) {
      const prev = salaryCredits[salaryCredits.length - 2].date;
      cycleLengthDays = Math.max(
        1,
        Math.round((cycleStart.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
      );
    } else {
      cycleLengthDays = 30;
    }
  } else {
    cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
    cycleLengthDays = 30;
  }

  const daysElapsed = Math.max(
    0,
    Math.floor((now.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24))
  );
  const daysRemaining = Math.max(1, cycleLengthDays - daysElapsed);

  const [monthlyIncome, upcomingObligations] = await Promise.all([
    getMonthlyIncome(userId),
    getUpcomingObligationsTotal(userId, cycleLengthDays),
  ]);

  const cycleBudget = Math.max(0, monthlyIncome - upcomingObligations);
  const spentSoFar = await getSpendBetween(userId, cycleStart, now);
  const idealSpentSoFar = cycleBudget * (daysElapsed / cycleLengthDays);
  const remainingBudget = Math.max(0, cycleBudget - spentSoFar);
  const dailyAllowance = remainingBudget / daysRemaining;

  let paceStatus: "ahead" | "on-track" | "under" = "on-track";
  if (idealSpentSoFar > 0) {
    if (spentSoFar > idealSpentSoFar * 1.15) paceStatus = "ahead";
    else if (spentSoFar < idealSpentSoFar * 0.85) paceStatus = "under";
  }

  return {
    cycleStart: cycleStart.toISOString(),
    cycleLengthDays,
    daysElapsed,
    daysRemaining,
    cycleBudget: Math.round(cycleBudget),
    spentSoFar: Math.round(spentSoFar),
    idealSpentSoFar: Math.round(idealSpentSoFar),
    remainingBudget: Math.round(remainingBudget),
    dailyAllowance: Math.round(dailyAllowance),
    paceStatus,
  };
}
