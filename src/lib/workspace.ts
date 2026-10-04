import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "workspace";
}

/**
 * Workspace URLs are name-based (/dashboard/workspaces/<slug>) rather than
 * exposing the raw database id. Slugs are globally unique (unlike names,
 * which are only unique per-user) and immutable once created, so renaming a
 * workspace never breaks a bookmarked or shared link.
 */
export async function generateUniqueWorkspaceSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let attempt = 0;

  while (await prisma.workspace.findUnique({ where: { slug }, select: { id: true } })) {
    attempt += 1;
    slug = attempt > 5 ? `${base}-${Date.now().toString(36)}` : `${base}-${randomBytes(2).toString("hex")}`;
  }

  return slug;
}

/**
 * A user shouldn't end up with two workspaces (that they're part of) sharing
 * the same name — easy to do by mistake, and confusing in the sidebar list.
 * Scoped per-user rather than globally unique, since two different friend
 * groups are allowed to both call their workspace "Trip".
 */
export async function isWorkspaceNameTakenByUser(
  userId: string,
  name: string,
  excludeWorkspaceId?: string
): Promise<boolean> {
  const existing = await prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true },
  });

  return existing.some(
    (m) =>
      m.workspace.id !== excludeWorkspaceId &&
      m.workspace.name.trim().toLowerCase() === name.trim().toLowerCase()
  );
}
