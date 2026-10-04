import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';

const registerSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function POST(req: NextRequest) {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
        return NextResponse.json({
            error: result.error.issues[0].message },
            { status: 400 }
        );
    }

    const {name, email, password } = result.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: { name, email, passwordHash }, 
    });

    await createSession(user.id);

    return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}

