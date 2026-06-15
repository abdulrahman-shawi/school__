-- AlterTable
ALTER TABLE "Homework" ADD COLUMN "attachmentUrl" TEXT;

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "receiverId" DROP NOT NULL;
