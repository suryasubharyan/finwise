import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(
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
    include: { members: true },
  });

  if (!workspace || !workspace.members.some((m) => m.userId === session.userId)) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const code = randomBytes(4).toString("hex").toUpperCase();

  const invite = await prisma.workspaceInvite.create({
    data: { workspaceId: workspace.id, code },
  });

  return NextResponse.json(invite, { status: 201 });
}
