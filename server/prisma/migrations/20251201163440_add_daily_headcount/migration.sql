-- CreateTable
CREATE TABLE "DailyHeadcount" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "site" "Site" NOT NULL,
    "onDutyCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyHeadcount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyHeadcount_site_date_key" ON "DailyHeadcount"("site", "date");
