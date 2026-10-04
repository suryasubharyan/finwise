import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { guessCategoryId } from "@/lib/categorize";

const transactionSchema = z.object({
  accountId: z.string(),
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(["DEBIT", "CREDIT"]),
  merchant: z.string().min(1, "Merchant is required"),
  categoryId: z.string().optional(),
  date: z.coerce.date(),
  description: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { account: { userId: session.userId } },
    orderBy: { date: "desc" },
    include: { category: true, account: true },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const result = transactionSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { accountId, ...rest } = result.data;

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== session.userId) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const categoryId = rest.categoryId ?? (await guessCategoryId(rest.merchant, session.userId));

  const transaction = await prisma.transaction.create({
    data: { ...rest, categoryId, accountId },
  });

  return NextResponse.json(transaction, { status: 201 });
}
