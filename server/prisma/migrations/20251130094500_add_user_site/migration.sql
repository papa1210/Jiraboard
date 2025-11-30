-- Add enum and column for user site
CREATE TYPE "Site" AS ENUM ('PQP_HT', 'MT1');

ALTER TABLE "User" ADD COLUMN "site" "Site" NOT NULL DEFAULT 'PQP_HT';
