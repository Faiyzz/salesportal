/*
  Warnings:

  - The values [CANCELLED] on the enum `MeetingStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MeetingStatus_new" AS ENUM ('SCHEDULED', 'COMPLETED', 'NO_SHOW', 'PASSED');
ALTER TABLE "public"."meetings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "meetings" ALTER COLUMN "status" TYPE "MeetingStatus_new" USING ("status"::text::"MeetingStatus_new");
ALTER TYPE "MeetingStatus" RENAME TO "MeetingStatus_old";
ALTER TYPE "MeetingStatus_new" RENAME TO "MeetingStatus";
DROP TYPE "public"."MeetingStatus_old";
ALTER TABLE "meetings" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';
COMMIT;
