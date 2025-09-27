/*
  Warnings:

  - The values [INACTIVE] on the enum `ProjectStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ProjectStatus_new" AS ENUM ('ACTIVE', 'IN_PROGRESS', 'COMPLETED');
ALTER TYPE "public"."ProjectStatus" RENAME TO "ProjectStatus_old";
ALTER TYPE "public"."ProjectStatus_new" RENAME TO "ProjectStatus";
DROP TYPE "public"."ProjectStatus_old";
COMMIT;
