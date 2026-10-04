import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateUniqueWorkspaceSlug, isWorkspaceNameTakenByUser } from "@/lib/workspace";

const createSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(50, "Keep it under 50 characters"),
  type: z.enum(["TRIP", "FLATMATES", "FAMILY", "OTHER"]).default("OTHER"),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.userId },
    include: {
      workspace: {
        include: { members: { include: { user: { select: { id: true, name: true } } } } },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const workspaces = memberships.map((m) => m.workspace);
  return NextResponse.json(workspaces);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  if (await isWorkspaceNameTakenByUser(session.userId, result.data.name)) {
    return NextResponse.json(
      { error: "You already have a workspace with this name" },
      { status: 409 }
    );
  }

  const slug = await generateUniqueWorkspaceSlug(result.data.name);

  const workspace = await prisma.workspace.create({
    data: {
      name: result.data.name,
      slug,
      type: result.data.type,
      createdBy: session.userId,
      members: { create: { userId: session.userId } },
    },
    include: { members: { include: { user: { select: { id: true, name: true } } } } },
  });

  return NextResponse.json(workspace, { status: 201 });
}
