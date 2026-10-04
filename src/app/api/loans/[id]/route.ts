import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const updateSchema = z.object({
  settled: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const loan = await prisma.personalLoan.findUnique({ where: { id } });
  if (!loan || loan.userId !== session.userId) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }

  const body = await req.json();
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const updated = await prisma.personalLoan.update({
    where: { id },
    data: {
      settled: result.data.settled,
      settledAt: result.data.settled ? new Date() : null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const loan = await prisma.personalLoan.findUnique({ where: { id } });
  if (!loan || loan.userId !== session.userId) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }

  await prisma.personalLoan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
