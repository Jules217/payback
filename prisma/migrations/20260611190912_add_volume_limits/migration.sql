-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "emailsSentDate" TIMESTAMP(3),
ADD COLUMN     "emailsSentToday" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "EmailTestLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailTestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailTestLog_organizationId_sentAt_idx" ON "EmailTestLog"("organizationId", "sentAt");

-- CreateIndex
CREATE INDEX "EmailTestLog_invoiceId_sentAt_idx" ON "EmailTestLog"("invoiceId", "sentAt");
