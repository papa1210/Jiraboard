-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('ON_DUTY', 'OFF_DUTY');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assignedResourceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "completeDate" TIMESTAMP(3),
ADD COLUMN     "completionPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Resource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ON_DUTY',
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
