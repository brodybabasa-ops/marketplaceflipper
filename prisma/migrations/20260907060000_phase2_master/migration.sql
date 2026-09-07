-- CreateEnum
CREATE TYPE "GroupAuthStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('GOOD', 'MONITOR', 'NEEDS_ATTENTION');

-- CreateEnum
CREATE TYPE "VerificationPipelineStatus" AS ENUM ('NOT_STARTED', 'APPLICATION_RECEIVED', 'REVIEWING', 'VISIT_SCHEDULING', 'VISIT_SCHEDULED', 'EVALUATION_COMPLETED', 'VERIFIED', 'ADDITIONAL_ACTION', 'DENIED', 'EXPIRED', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "InspectionKind" AS ENUM ('SHOP', 'MOBILE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'INSPECTOR';
ALTER TYPE "UserRole" ADD VALUE 'SUPPORT';
ALTER TYPE "UserRole" ADD VALUE 'FINANCE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobStatus" ADD VALUE 'CHECKED_IN';
ALTER TYPE "JobStatus" ADD VALUE 'QUALITY_CHECK';
ALTER TYPE "JobStatus" ADD VALUE 'READY';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DisputeCategory" ADD VALUE 'UNAUTHORIZED_WORK';
ALTER TYPE "DisputeCategory" ADD VALUE 'WORK_NOT_COMPLETED';

-- AlterTable
ALTER TABLE "MechanicProfile" ADD COLUMN     "foundingApprovedAt" TIMESTAMP(3),
ADD COLUMN     "foundingNumber" INTEGER,
ADD COLUMN     "foundingProgramVersion" TEXT,
ADD COLUMN     "isFoundingProvider" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSelect" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "marketplaceEligible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "subscriptionFeeWaived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationPipeline" "VerificationPipelineStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "color" TEXT,
ADD COLUMN     "plate" TEXT;

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "drivability" TEXT,
ADD COLUMN     "noticedWhen" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "startedWhen" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "videoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "warningLights" TEXT,
ADD COLUMN     "whenItHappens" TEXT;

-- AlterTable
ALTER TABLE "EstimateLineItem" ADD COLUMN     "repairGroupId" UUID;

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "exposureCents" INTEGER;

-- AlterTable
ALTER TABLE "PlatformConfig" ADD COLUMN     "marketplaceFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 3,
ADD COLUMN     "processorFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "selectCriteria" JSONB,
ADD COLUMN     "verificationStandards" JSONB;

-- CreateTable
CREATE TABLE "RepairGroup" (
    "id" UUID NOT NULL,
    "estimateId" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "findingId" UUID,
    "title" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL DEFAULT 'RECOMMENDED',
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "status" "GroupAuthStatus" NOT NULL DEFAULT 'PENDING',
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairAuthorization" (
    "id" UUID NOT NULL,
    "estimateId" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "originalCents" INTEGER NOT NULL,
    "approvedCents" INTEGER NOT NULL,
    "declinedCents" INTEGER NOT NULL,
    "pendingCents" INTEGER NOT NULL DEFAULT 0,
    "authorizedCents" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepairAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairAuthorizationDecision" (
    "id" UUID NOT NULL,
    "authorizationId" UUID NOT NULL,
    "repairGroupId" UUID NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepairAuthorizationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendedWork" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "mechanicProfileId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "jobId" UUID,
    "estimateId" UUID,
    "repairGroupId" UUID,
    "title" TEXT NOT NULL,
    "estimatedCents" INTEGER NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "notes" TEXT,
    "declineDate" TIMESTAMP(3),
    "followUpDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendedWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleInspection" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "mechanicUserId" UUID NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionFinding" (
    "id" UUID NOT NULL,
    "inspectionId" UUID NOT NULL,
    "section" TEXT NOT NULL,
    "status" "FindingStatus" NOT NULL,
    "explanation" TEXT,
    "recommendation" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationApplication" (
    "id" UUID NOT NULL,
    "mechanicProfileId" UUID NOT NULL,
    "status" "VerificationPipelineStatus" NOT NULL DEFAULT 'APPLICATION_RECEIVED',
    "kind" "InspectionKind" NOT NULL DEFAULT 'MOBILE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationInspection" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "mechanicProfileId" UUID NOT NULL,
    "inspectorId" UUID,
    "kind" "InspectionKind" NOT NULL DEFAULT 'SHOP',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "VerificationPipelineStatus" NOT NULL DEFAULT 'VISIT_SCHEDULED',
    "score" INTEGER,
    "passed" BOOLEAN,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationChecklistItem" (
    "id" UUID NOT NULL,
    "inspectionId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "score" INTEGER,
    "passed" BOOLEAN,
    "notes" TEXT,
    "notApplicable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationEvent" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "actorId" TEXT,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "assigneeId" UUID,
    "topic" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "jobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RepairGroup_estimateId_status_idx" ON "RepairGroup"("estimateId", "status");

-- CreateIndex
CREATE INDEX "RepairGroup_jobId_idx" ON "RepairGroup"("jobId");

-- CreateIndex
CREATE INDEX "RepairAuthorization_jobId_submittedAt_idx" ON "RepairAuthorization"("jobId", "submittedAt");

-- CreateIndex
CREATE INDEX "RecommendedWork_mechanicProfileId_status_idx" ON "RecommendedWork"("mechanicProfileId", "status");

-- CreateIndex
CREATE INDEX "RecommendedWork_customerId_status_idx" ON "RecommendedWork"("customerId", "status");

-- CreateIndex
CREATE INDEX "AuditEvent_targetType_targetId_idx" ON "AuditEvent"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "EstimateLineItem" ADD CONSTRAINT "EstimateLineItem_repairGroupId_fkey" FOREIGN KEY ("repairGroupId") REFERENCES "RepairGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairGroup" ADD CONSTRAINT "RepairGroup_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairGroup" ADD CONSTRAINT "RepairGroup_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairAuthorization" ADD CONSTRAINT "RepairAuthorization_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairAuthorization" ADD CONSTRAINT "RepairAuthorization_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairAuthorization" ADD CONSTRAINT "RepairAuthorization_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairAuthorizationDecision" ADD CONSTRAINT "RepairAuthorizationDecision_authorizationId_fkey" FOREIGN KEY ("authorizationId") REFERENCES "RepairAuthorization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairAuthorizationDecision" ADD CONSTRAINT "RepairAuthorizationDecision_repairGroupId_fkey" FOREIGN KEY ("repairGroupId") REFERENCES "RepairGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendedWork" ADD CONSTRAINT "RecommendedWork_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendedWork" ADD CONSTRAINT "RecommendedWork_mechanicProfileId_fkey" FOREIGN KEY ("mechanicProfileId") REFERENCES "MechanicProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendedWork" ADD CONSTRAINT "RecommendedWork_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendedWork" ADD CONSTRAINT "RecommendedWork_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendedWork" ADD CONSTRAINT "RecommendedWork_repairGroupId_fkey" FOREIGN KEY ("repairGroupId") REFERENCES "RepairGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInspection" ADD CONSTRAINT "VehicleInspection_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInspection" ADD CONSTRAINT "VehicleInspection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionFinding" ADD CONSTRAINT "InspectionFinding_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "VehicleInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationApplication" ADD CONSTRAINT "VerificationApplication_mechanicProfileId_fkey" FOREIGN KEY ("mechanicProfileId") REFERENCES "MechanicProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationInspection" ADD CONSTRAINT "VerificationInspection_mechanicProfileId_fkey" FOREIGN KEY ("mechanicProfileId") REFERENCES "MechanicProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationInspection" ADD CONSTRAINT "VerificationInspection_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "VerificationApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationInspection" ADD CONSTRAINT "VerificationInspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationChecklistItem" ADD CONSTRAINT "VerificationChecklistItem_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "VerificationInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationEvent" ADD CONSTRAINT "VerificationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "VerificationApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

