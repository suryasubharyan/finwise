import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const updateSchema = z.object({
  type: z.enum(["RENT", "EMI", "LOAN", "CREDIT_CARD", "SUBSCRIPTION", "OTHER"]).optional(),
  amount: z.number().positive().optional(),
  dueDate: z.coerce.date().optional(),
  recurring: z.boolean().optional(),
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
  const obligation = await prisma.obligation.findUnique({ where: { id } });
  if (!obligation || obligation.userId !== session.userId) {
    return NextResponse.json({ error: "Obligation not found" }, { status: 404 });
  }

  const body = await req.json();
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const updated = await prisma.obligation.update({ where: { id }, data: result.data });
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
  const obligation = await prisma.obligation.findUnique({ where: { id } });
  if (!obligation || obligation.userId !== session.userId) {
    return NextResponse.json({ error: "Obligation not found" }, { status: 404 });
  }

  await prisma.obligation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
