-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "scheduledConfirmedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MechanicProfile" ADD COLUMN     "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeConnectAccountId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "smsNotifications" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MechanicBlockedDate" (
    "id" UUID NOT NULL,
    "mechanicProfileId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MechanicBlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "mechanicUserId" UUID NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "commissionCents" INTEGER NOT NULL,
    "mechanicPayoutCents" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "providerIntentId" TEXT,
    "providerChargeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MechanicBlockedDate_mechanicProfileId_date_key" ON "MechanicBlockedDate"("mechanicProfileId", "date");

-- CreateIndex
CREATE INDEX "Payment_jobId_status_idx" ON "Payment"("jobId", "status");

-- CreateIndex
CREATE INDEX "Payment_customerId_idx" ON "Payment"("customerId");

-- AddForeignKey
ALTER TABLE "MechanicBlockedDate" ADD CONSTRAINT "MechanicBlockedDate_mechanicProfileId_fkey" FOREIGN KEY ("mechanicProfileId") REFERENCES "MechanicProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
