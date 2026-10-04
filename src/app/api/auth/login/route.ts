import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
        return NextResponse.json(
            { error: result.error.issues[0].message },
            { status: 400 }
        );
    }

    const { email, password } = result.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
       return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createSession(user.id);

    return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}

