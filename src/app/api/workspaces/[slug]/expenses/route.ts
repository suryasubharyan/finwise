import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.coerce.date(),
  category: z.string().optional(),
  tag: z.string().max(40).optional(),
  paidByUserId: z.string().optional(),
  splitType: z.enum(["EQUAL", "CUSTOM", "NONE"]),
  participantIds: z.array(z.string()).optional(),
  splits: z.array(z.object({ userId: z.string(), shareAmount: z.number().positive() })).optional(),
});

export async function POST(
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
  const result = expenseSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const data = result.data;
  const paidByUserId = data.paidByUserId ?? session.userId;
  const memberIds = new Set(workspace.members.map((m) => m.userId));

  if (!memberIds.has(paidByUserId)) {
    return NextResponse.json({ error: "Payer must be a workspace member" }, { status: 400 });
  }

  let splits: { userId: string; shareAmount: number }[];

  if (data.splitType === "NONE") {
    splits = [];
  } else if (data.splitType === "EQUAL") {
    const participantIds = (data.participantIds ?? Array.from(memberIds)).filter((pid) =>
      memberIds.has(pid)
    );
    if (participantIds.length === 0) {
      return NextResponse.json({ error: "At least one participant is required" }, { status: 400 });
    }
    const share = Math.round((data.amount / participantIds.length) * 100) / 100;
    splits = participantIds.map((userId) => ({ userId, shareAmount: share }));
  } else {
    if (!data.splits || data.splits.length === 0) {
      return NextResponse.json({ error: "Custom splits are required" }, { status: 400 });
    }
    const invalidMember = data.splits.find((s) => !memberIds.has(s.userId));
    if (invalidMember) {
      return NextResponse.json({ error: "All split users must be workspace members" }, { status: 400 });
    }
    const totalSplit = data.splits.reduce((sum, s) => sum + s.shareAmount, 0);
    if (Math.abs(totalSplit - data.amount) > 1) {
      return NextResponse.json(
        { error: "Split amounts must add up to the total expense amount" },
        { status: 400 }
      );
    }
    splits = data.splits;
  }

  const expense = await prisma.groupExpense.create({
    data: {
      workspaceId: workspace.id,
      paidByUserId,
      description: data.description,
      amount: data.amount,
      category: data.category,
      tag: data.tag,
      date: data.date,
      splits: { create: splits },
    },
    include: { splits: true },
  });

  return NextResponse.json(expense, { status: 201 });
}
