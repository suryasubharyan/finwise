import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getTotalBalance, getMonthlyIncome } from "@/lib/finance";

const purchaseComparisonSchema = z.object({
  name: z.string().min(1),
  type: z.literal("PURCHASE_COMPARISON"),
  price: z.number().positive(),
  waitMonths: z.number().int().min(1).max(24).default(2),
  emiMonths: z.number().int().min(1).max(36).default(6),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const scenarios = await prisma.scenario.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(scenarios);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const result = purchaseComparisonSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, price, waitMonths, emiMonths } = result.data;
  const userId = session.userId;

  const [currentSavings, monthlyIncome] = await Promise.all([
    getTotalBalance(userId),
    getMonthlyIncome(userId),
  ]);

  // This is a snapshot copy of current state with assumptions changed —
  // it never writes back to the user's real Account/Goal records.
  const buyNow = {
    remainingSavings: Math.round(currentSavings - price),
  };

  const wait = {
    waitMonths,
    projectedSavingsBeforePurchase: Math.round(currentSavings + monthlyIncome * waitMonths),
    remainingSavingsAfterPurchase: Math.round(
      currentSavings + monthlyIncome * waitMonths - price
    ),
  };

  const emi = {
    emiMonths,
    monthlyPayment: Math.round(price / emiMonths),
    remainingSavingsAfterFirstPayment: Math.round(currentSavings - price / emiMonths),
  };

  const assumptionsJson = { price, waitMonths, emiMonths };
  const resultJson = { buyNow, wait, emi };

  const scenario = await prisma.scenario.create({
    data: {
      userId,
      name,
      assumptionsJson,
      resultJson,
    },
  });

  return NextResponse.json(scenario, { status: 201 });
}
