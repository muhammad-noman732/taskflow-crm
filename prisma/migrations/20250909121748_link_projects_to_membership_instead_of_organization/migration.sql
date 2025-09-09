/*
  Warnings:

  - You are about to drop the column `createdById` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Task` table. All the data in the column will be lost.
  - Added the required column `membershipId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Project" DROP CONSTRAINT "Project_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Project" DROP CONSTRAINT "Project_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_createdById_fkey";

-- AlterTable
ALTER TABLE "public"."OrganizationMembership" ALTER COLUMN "role" SET DEFAULT 'OWNER';

-- AlterTable
ALTER TABLE "public"."Project" DROP COLUMN "createdById",
DROP COLUMN "organizationId",
ADD COLUMN     "membershipId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "createdById";

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "public"."OrganizationMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
