import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDebtHealth } from "@/lib/debtHealth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const data = await getDebtHealth(session.userId);
  return NextResponse.json(data);
}
