-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetLink" TEXT,
ADD COLUMN     "resetLinkExpiry" TIMESTAMP(3);
