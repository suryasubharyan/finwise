import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getTotalBalance, getMonthlyIncome, getUpcomingObligationsTotal } from "@/lib/finance";

const affordabilitySchema = z.object({
  price: z.number().positive("Price must be greater than 0"),
  paymentMethod: z.enum(["CASH", "EMI"]),
  emiMonths: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const result = affordabilitySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { price, paymentMethod, emiMonths } = result.data;

  if (paymentMethod === "EMI" && !emiMonths) {
    return NextResponse.json(
      { error: "emiMonths is required for EMI payment method" },
      { status: 400 }
    );
  }

  const userId = session.userId;
  const [currentSavings, monthlyIncome, upcomingObligations] = await Promise.all([
    getTotalBalance(userId),
    getMonthlyIncome(userId),
    getUpcomingObligationsTotal(userId, 30),
  ]);

  const emergencyReserveTarget = monthlyIncome * 3;
  const monthlyEmi =
    paymentMethod === "EMI" ? Math.round(price / (emiMonths as number)) : null;

  const immediateImpact = paymentMethod === "CASH" ? price : (monthlyEmi as number);
  const remainingSavings = currentSavings - immediateImpact - upcomingObligations;
  const emergencyReserveImpact = remainingSavings - emergencyReserveTarget;

  return NextResponse.json({
    purchasePrice: price,
    paymentMethod,
    monthlyEmi,
    currentSavings,
    upcomingObligations,
    remainingSavingsAfterPurchase: Math.round(remainingSavings),
    emergencyReserveTarget: Math.round(emergencyReserveTarget),
    emergencyReserveImpact: Math.round(emergencyReserveImpact),
    canMeetEmergencyReserve: emergencyReserveImpact >= 0,
    assumptions: [
      "Emergency reserve target estimated as 3x monthly income.",
      paymentMethod === "EMI"
        ? "EMI shown is a simple division of price by months, excluding interest."
        : "Full price is deducted from current savings immediately.",
      "Upcoming obligations (next 30 days) are already reserved and subtracted.",
    ],
  });
}
