-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('STAFF', 'INTERNSHIP');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "isActive" BOOLEAN DEFAULT true,
ADD COLUMN     "picture" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userType" "public"."UserType" DEFAULT 'STAFF';
