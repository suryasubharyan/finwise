import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const onboardingSchema = z.object({
    incomeSource: z.enum(["SALARY", "BUSINESS", "FREELANCE","STUDENT", "OTHER"]),
    monthlyIncome: z.number().positive("Monthly income must be a greater than 0"),
    incomeIsFixed: z.boolean(),
    priority: z.enum([
        "SAVE_MORE",
        "CONTROL_SPENDING",
        "PLAN_PURCHASE",
        "PAY_DEBT",
        "EMERGENCY_FUND",
        "UNDERSTAND_FINANCES",
    ]),
});

export async function PATCH(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Not Authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const result = onboardingSchema.safeParse(body);

    if (!result.success) {
        return NextResponse.json(
            { error: result.error.issues[0].message },
            { status: 400 }
        );
    }

    const user = await prisma.user.update({
        where: { id: session.userId },
        data: { ...result.data, onboardingDone: true},
    });

    return NextResponse.json({
        id: user.id,
        onboardingDone: user.onboardingDone,
    });
}

