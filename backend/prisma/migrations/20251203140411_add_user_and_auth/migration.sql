-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'ORGANIZER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'NONE',
    "kycApplicantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_kycApplicantId_key" ON "users"("kycApplicantId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_kycApplicantId_fkey" FOREIGN KEY ("kycApplicantId") REFERENCES "kyc_verifications"("applicantId") ON DELETE SET NULL ON UPDATE CASCADE;
