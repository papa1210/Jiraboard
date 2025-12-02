-- CreateTable
CREATE TABLE "TaskActualLog" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "hours" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskActualLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskActualLog_taskId_date_key" ON "TaskActualLog"("taskId", "date");

-- AddForeignKey
ALTER TABLE "TaskActualLog" ADD CONSTRAINT "TaskActualLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
