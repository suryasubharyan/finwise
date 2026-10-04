import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum([
    "EMERGENCY_FUND",
    "TRAVEL",
    "CAR",
    "HOUSE",
    "EDUCATION",
    "INVESTMENT",
    "CUSTOM",
  ]),
  targetAmount: z.number().positive("Target amount must be greater than 0"),
  currentAmount: z.number().min(0).optional(),
  targetDate: z.coerce.date().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const goals = await prisma.goal.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const result = goalSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const goal = await prisma.goal.create({
    data: { ...result.data, userId: session.userId },
  });

  return NextResponse.json(goal, { status: 201 });
}
