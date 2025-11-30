/*
  Warnings:

  - The `role` column on the `Resource` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ResourceRole" AS ENUM ('SUPV', 'ENG');

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "role",
ADD COLUMN     "role" "ResourceRole" NOT NULL DEFAULT 'ENG';
