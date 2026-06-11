-- AlterEnum
ALTER TYPE "ReminderEventStatus" ADD VALUE 'SENDING';

-- AlterTable
ALTER TABLE "ReminderEvent" ADD COLUMN     "claimedAt" TIMESTAMP(3);
