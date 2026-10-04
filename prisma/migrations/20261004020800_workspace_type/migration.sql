/*
  Warnings:

  - Added the required column `updatedAt` to the `workspaces` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkspaceType" AS ENUM ('TRIP', 'FLATMATES', 'FAMILY', 'OTHER');

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "type" "WorkspaceType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
