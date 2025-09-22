-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."OrganizationMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
