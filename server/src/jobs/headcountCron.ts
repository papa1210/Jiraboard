import cron from "node-cron";
import { prisma } from "../prisma";
import { Site } from "@prisma/client";

const SITES: Site[] = ["PQP_HT", "MT1"];

const getTodayDateOnly = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const startHeadcountCron = () => {
  // Runs at 23:59 server local time; set TZ env if needed (e.g., Asia/Ho_Chi_Minh)
  cron.schedule("59 23 * * *", async () => {
    const dateOnly = getTodayDateOnly();
    try {
      for (const site of SITES) {
        const onDutyCount = await prisma.user.count({
          where: {
            site,
            status: "ON_DUTY",
          },
        });

        await prisma.dailyHeadcount.upsert({
          where: { daily_headcount_site_date: { site, date: dateOnly } },
          update: { onDutyCount },
          create: { site, date: dateOnly, onDutyCount },
        });
      }
      console.log(`[headcount cron] saved for ${dateOnly.toISOString().slice(0, 10)}`);
    } catch (err) {
      console.error("[headcount cron] failed", err);
    }
  });
};
