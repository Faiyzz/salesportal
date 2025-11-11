/*
  Warnings:

  - You are about to drop the column `commissionRate` on the `commissions` table. All the data in the column will be lost.
  - Added the required column `appliedRate` to the `commissions` table without a default value. This is not possible if the table is not empty.

*/

-- First, add the new column with a default value
ALTER TABLE "commissions" ADD COLUMN "appliedRate" DECIMAL(5,2) DEFAULT 0.00;

-- Update existing records to use commissionRate as appliedRate
UPDATE "commissions" SET "appliedRate" = COALESCE("commissionRate", 0.00);

-- Now make the column required
ALTER TABLE "commissions" ALTER COLUMN "appliedRate" SET NOT NULL;

-- Add the slabId column
ALTER TABLE "commissions" ADD COLUMN "slabId" TEXT;

-- Drop the old commissionRate column
ALTER TABLE "commissions" DROP COLUMN "commissionRate";

-- CreateTable
CREATE TABLE "commission_slabs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "minAmount" DECIMAL(10,2) NOT NULL,
    "maxAmount" DECIMAL(10,2),
    "rate" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_slabs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "commission_slabs" ADD CONSTRAINT "commission_slabs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
