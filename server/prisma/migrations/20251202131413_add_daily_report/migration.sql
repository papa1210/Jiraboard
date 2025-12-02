-- CreateTable
CREATE TABLE "DailyReportSnapshot" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "reportTasks" JSONB NOT NULL,
    "nextdayTasks" JSONB NOT NULL,
    "generatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReportSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyReportSnapshot_date_key" ON "DailyReportSnapshot"("date");

-- AddForeignKey
ALTER TABLE "DailyReportSnapshot" ADD CONSTRAINT "DailyReportSnapshot_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
