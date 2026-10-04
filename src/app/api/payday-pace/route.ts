import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDailyPace, getPaydayCycleAnalysis } from "@/lib/paydayCycle";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [pace, cycle] = await Promise.all([
    getDailyPace(session.userId),
    getPaydayCycleAnalysis(session.userId),
  ]);

  return NextResponse.json({ pace, cycle });
}
