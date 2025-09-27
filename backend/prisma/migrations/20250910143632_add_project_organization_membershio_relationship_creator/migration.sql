/*
  Warnings:

  - You are about to drop the column `deadline` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `membershipId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - Made the column `slug` on table `Organization` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "public"."Organization" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Project" DROP COLUMN "deadline",
DROP COLUMN "membershipId",
ALTER COLUMN "createdBy" DROP DEFAULT,
ALTER COLUMN "orgId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "passwordHash";

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "public"."Organization"("slug");

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."OrganizationMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
