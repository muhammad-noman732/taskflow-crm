/*
  Warnings:

  - A unique constraint covering the columns `[userId,organizationId]` on the table `OrganizationMembership` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_userId_organizationId_key" ON "public"."OrganizationMembership"("userId", "organizationId");
