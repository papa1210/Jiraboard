-- CreateTable
CREATE TABLE "TaskScopeLog" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "deltaHours" INTEGER NOT NULL DEFAULT 0,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskScopeLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaskScopeLog" ADD CONSTRAINT "TaskScopeLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskScopeLog" ADD CONSTRAINT "TaskScopeLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
