-- AlterTable
ALTER TABLE "public"."Channel" ADD COLUMN     "taskId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Channel" ADD CONSTRAINT "Channel_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
