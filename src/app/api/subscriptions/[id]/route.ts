import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const updateSchema = z.object({
  status: z.enum(["EXPECTED", "IGNORED", "INACTIVE"]),
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

  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription || subscription.userId !== session.userId) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  const body = await req.json();
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: { status: result.data.status },
  });

  return NextResponse.json(updated);
}
