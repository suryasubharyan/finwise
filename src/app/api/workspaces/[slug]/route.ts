import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { simplifyDebts } from "@/lib/settlement";
import { isWorkspaceNameTakenByUser } from "@/lib/workspace";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { slug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      expenses: {
        include: { splits: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!workspace || !workspace.members.some((m) => m.userId === session.userId)) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Net balance per member: +amount they paid for others, -amount they owe.
  const balances = new Map<string, number>();
  for (const m of workspace.members) balances.set(m.userId, 0);

  for (const expense of workspace.expenses) {
    if (expense.splits.length === 0) continue; // logged for tracking only, not shared
    balances.set(
      expense.paidByUserId,
      (balances.get(expense.paidByUserId) ?? 0) + Number(expense.amount)
    );
    for (const split of expense.splits) {
      balances.set(split.userId, (balances.get(split.userId) ?? 0) - Number(split.shareAmount));
    }
  }

  const balanceList = Array.from(balances.entries()).map(([userId, amount]) => ({
    userId,
    amount: Math.round(amount),
  }));

  const settlement = simplifyDebts(balanceList);

  return NextResponse.json({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    type: workspace.type,
    members: workspace.members.map((m) => ({ id: m.user.id, name: m.user.name })),
    expenses: workspace.expenses.map((e) => ({
      id: e.id,
      description: e.description,
      amount: Number(e.amount),
      category: e.category,
      tag: e.tag,
      date: e.date,
      paidByUserId: e.paidByUserId,
      splits: e.splits.map((s) => ({ userId: s.userId, shareAmount: Number(s.shareAmount) })),
    })),
    balances: balanceList,
    settlement,
  });
}

const updateSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(50, "Keep it under 50 characters").optional(),
  type: z.enum(["TRIP", "FLATMATES", "FAMILY", "OTHER"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { slug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: { members: true },
  });

  if (!workspace || !workspace.members.some((m) => m.userId === session.userId)) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const body = await req.json();
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  if (
    result.data.name &&
    (await isWorkspaceNameTakenByUser(session.userId, result.data.name, workspace.id))
  ) {
    return NextResponse.json(
      { error: "You already have a workspace with this name" },
      { status: 409 }
    );
  }

  const updated = await prisma.workspace.update({
    where: { id: workspace.id },
    data: result.data,
  });

  return NextResponse.json(updated);
}
