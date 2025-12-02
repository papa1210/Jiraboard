-- AlterTable
ALTER TABLE "TaskActualLog" ADD COLUMN     "createdById" INTEGER;

-- AddForeignKey
ALTER TABLE "TaskActualLog" ADD CONSTRAINT "TaskActualLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
