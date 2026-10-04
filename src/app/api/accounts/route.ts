import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const accountSchema = z.object({
    institution: z.string().min(1, "Institution is required"),
    accountType: z.enum(["BANK", "CASH", "CARD", "WALLET", "OTHER"]),
    currentBalance: z.number().nonnegative("Balance must be a non-negative number"),
    currency: z.string().default("INR"),
});

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Not Authenticated" }, { status: 401 });
    }

    const accounts = await prisma.account.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Not Authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const result = accountSchema.safeParse(body);

    if (!result.success) {
        return NextResponse.json(
            { error: result.error.issues[0].message },
            { status: 400 }
        );
    }

    const account = await prisma.account.create({
        data: { ...result.data, userId: session.userId },
    });

    return NextResponse.json(account, { status: 201 });

}