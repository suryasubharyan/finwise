import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const MIN_OCCURRENCES = 2;
const MONTHLY_INTERVAL_MIN_DAYS = 24;
const MONTHLY_INTERVAL_MAX_DAYS = 36;
const AMOUNT_VARIANCE_TOLERANCE = 0.1; // 10%

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { type: "DEBIT", account: { userId: session.userId } },
    orderBy: { date: "asc" },
  });

  const byMerchant = new Map<string, typeof transactions>();
  for (const txn of transactions) {
    const key = txn.merchant.trim().toLowerCase();
    const list = byMerchant.get(key) ?? [];
    list.push(txn);
    byMerchant.set(key, list);
  }

  let detected = 0;

  for (const [, txns] of byMerchant) {
    if (txns.length < MIN_OCCURRENCES) continue;

    const intervals: number[] = [];
    for (let i = 1; i < txns.length; i++) {
      const days =
        (txns[i].date.getTime() - txns[i - 1].date.getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    const isMonthly =
      avgInterval >= MONTHLY_INTERVAL_MIN_DAYS && avgInterval <= MONTHLY_INTERVAL_MAX_DAYS;
    if (!isMonthly) continue;

    const amounts = txns.map((t) => Number(t.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const withinTolerance = amounts.every(
      (a) => Math.abs(a - avgAmount) / avgAmount <= AMOUNT_VARIANCE_TOLERANCE
    );
    if (!withinTolerance) continue;

    const lastTxn = txns[txns.length - 1];
    const nextDate = new Date(
      lastTxn.date.getTime() + Math.round(avgInterval) * 24 * 60 * 60 * 1000
    );

    const existing = await prisma.subscription.findFirst({
      where: { userId: session.userId, merchant: lastTxn.merchant },
    });

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: { amount: avgAmount, nextDate },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: session.userId,
          merchant: lastTxn.merchant,
          amount: avgAmount,
          frequency: "MONTHLY",
          nextDate,
          status: "EXPECTED",
        },
      });
    }

    detected++;
  }

  return NextResponse.json({ detected });
}
