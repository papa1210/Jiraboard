-- Add estimatedHours and actualHours to Task
ALTER TABLE "Task" ADD COLUMN "estimatedHours" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Task" ADD COLUMN "actualHours" INTEGER NOT NULL DEFAULT 0;
