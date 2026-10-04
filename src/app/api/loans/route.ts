import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const loanSchema = z.object({
  personName: z.string().min(1, "Name is required"),
  type: z.enum(["LENT", "BORROWED"]),
  amount: z.number().positive("Amount must be greater than 0"),
  description: z.string().optional(),
  date: z.coerce.date(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const loans = await prisma.personalLoan.findMany({
    where: { userId: session.userId },
    orderBy: [{ settled: "asc" }, { date: "desc" }],
  });

  return NextResponse.json(loans);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const result = loanSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const loan = await prisma.personalLoan.create({
    data: { ...result.data, userId: session.userId },
  });

  return NextResponse.json(loan, { status: 201 });
}
