/*
  Warnings:

  - You are about to drop the column `entiyId` on the `audit_logs` table. All the data in the column will be lost.
  - The `status` column on the `subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('EXPECTED', 'IGNORED', 'INACTIVE');

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "entiyId",
ADD COLUMN     "entityId" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "status",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'EXPECTED';

-- DropEnum
DROP TYPE "SubsscriptionStatus";
