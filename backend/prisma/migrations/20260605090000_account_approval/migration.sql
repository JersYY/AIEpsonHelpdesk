-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "accountStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "reviewNote" TEXT;

-- Existing local/demo users predate approval flow, so keep them active.
UPDATE "User"
SET "accountStatus" = 'ACTIVE',
    "approvedAt" = COALESCE("approvedAt", CURRENT_TIMESTAMP)
WHERE "accountStatus" = 'PENDING';

-- CreateIndex
CREATE INDEX "User_accountStatus_idx" ON "User"("accountStatus");
