import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
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

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const nextMonthStart = startOfNextMonth(now);
  const lastMonthStart = startOfPreviousMonth(now);

  const [currentSpend, previousSpend] = await Promise.all([
    getCategorySpend(session.userId, thisMonthStart, nextMonthStart),
    getCategorySpend(session.userId, lastMonthStart, thisMonthStart),
  ]);

  const previousByCategory = new Map(
    previousSpend.map((c) => [c.categoryName, c.total])
  );

  const categories = currentSpend.map((c) => {
    const previousTotal = previousByCategory.get(c.categoryName) ?? 0;
    const change =
      previousTotal > 0
        ? Math.round(((c.total - previousTotal) / previousTotal) * 100)
        : null;

    return {
      categoryName: c.categoryName,
      total: c.total,
      previousTotal,
      changePercent: change,
    };
  });

  const totalThisMonth = categories.reduce((sum, c) => sum + c.total, 0);

  const biggestMover = categories
    .filter((c) => c.changePercent !== null && c.previousTotal > 0)
    .sort((a, b) => Math.abs(b.total - b.previousTotal) - Math.abs(a.total - a.previousTotal))[0];

  let headline = "No spending recorded yet this month.";
  if (categories.length > 0 && biggestMover && biggestMover.changePercent !== null) {
    const direction = biggestMover.changePercent >= 0 ? "increased" : "decreased";
    headline = `Your ${biggestMover.categoryName.toLowerCase()} spending ${direction} ${Math.abs(
      biggestMover.changePercent
    )}% compared to last month.`;
  } else if (categories.length > 0) {
    headline = `Your biggest expense this month is ${categories[0].categoryName.toLowerCase()} at ₹${categories[0].total.toLocaleString(
      "en-IN"
    )}.`;
  }

  return NextResponse.json({ totalThisMonth, categories, headline });
}
