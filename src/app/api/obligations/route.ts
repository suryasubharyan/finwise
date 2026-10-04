import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const obligationSchema = z.object({
  type: z.enum(["RENT", "EMI", "LOAN", "CREDIT_CARD", "SUBSCRIPTION", "OTHER"]),
  amount: z.number().positive("Amount must be greater than 0"),
  dueDate: z.coerce.date(),
  recurring: z.boolean().optional().default(true),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const obligations = await prisma.obligation.findMany({
    where: { userId: session.userId },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(obligations);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const result = obligationSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const obligation = await prisma.obligation.create({
    data: { ...result.data, userId: session.userId },
  });

  return NextResponse.json(obligation, { status: 201 });
}
