import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { guessCategoryId } from "@/lib/categorize";

const importSchema = z.object({
  accountId: z.string(),
  csvText: z.string().min(1, "CSV file is empty"),
});

const csvRowSchema = z.object({
  Date: z.string(),
  Merchant: z.string().min(1),
  Amount: z.coerce.number().positive(),
  Type: z.enum(["DEBIT", "CREDIT"]),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const result = importSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { accountId, csvText } = result.data;

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== session.userId) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  const validRows: {
    date: Date;
    merchant: string;
    amount: number;
    type: "DEBIT" | "CREDIT";
    categoryId: string | null;
  }[] = [];
  let skipped = 0;

  for (const row of parsed.data) {
    const rowResult = csvRowSchema.safeParse(row);
    if (!rowResult.success) {
      skipped++;
      continue;
    }
    validRows.push({
      date: new Date(rowResult.data.Date),
      merchant: rowResult.data.Merchant,
      amount: rowResult.data.Amount,
      type: rowResult.data.Type,
      categoryId: await guessCategoryId(rowResult.data.Merchant, session.userId),
    });
  }

  if (validRows.length > 0) {
    await prisma.transaction.createMany({
      data: validRows.map((row) => ({ ...row, accountId })),
    });
  }

  return NextResponse.json({ imported: validRows.length, skipped });
}
