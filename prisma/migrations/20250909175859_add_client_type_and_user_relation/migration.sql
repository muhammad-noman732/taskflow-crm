-- CreateEnum
CREATE TYPE "public"."ClientType" AS ENUM ('CRM', 'INVITED');

-- DropIndex
DROP INDEX "public"."Client_email_key";

-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "type" "public"."ClientType" NOT NULL DEFAULT 'CRM',
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
