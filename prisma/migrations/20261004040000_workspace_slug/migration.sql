-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN "slug" TEXT;

-- Backfill slug from existing names for any pre-existing rows
UPDATE "workspaces" SET "slug" = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id, 1, 6) WHERE "slug" IS NULL;

-- AlterTable
ALTER TABLE "workspaces" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");
