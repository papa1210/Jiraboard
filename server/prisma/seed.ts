import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: { email: "demo@example.com", passwordHash, name: "Demo" },
  });
  await prisma.project.upsert({
    where: { key: "DEMO" },
    update: {},
    create: { name: "Demo Project", key: "DEMO", ownerId: user.id },
  });
  console.log("Seed done");
}

main().finally(() => prisma.$disconnect());
