import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const joinSchema = z.object({
  code: z.string().min(1, "Invite code is required"),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const result = joinSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const invite = await prisma.workspaceInvite.findUnique({
    where: { code: result.data.code.toUpperCase() },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: invite.workspaceId, userId: session.userId },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "You're already in this workspace" }, { status: 409 });
  }

  await prisma.workspaceMember.create({
    data: { workspaceId: invite.workspaceId, userId: session.userId },
  });

  const workspace = await prisma.workspace.findUnique({
    where: { id: invite.workspaceId },
    select: { slug: true },
  });

  return NextResponse.json({ slug: workspace?.slug }, { status: 201 });
}
