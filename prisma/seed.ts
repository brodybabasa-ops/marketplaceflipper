import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ingestSource } from "../src/lib/ingestion/pipeline";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("LotlineDemo!2026", 12);

  await prisma.user.upsert({
    where: { email: "admin@lotline.local" },
    update: { role: "admin", passwordHash },
    create: {
      email: "admin@lotline.local",
      name: "Lotline Admin",
      role: "admin",
      passwordHash,
    },
  });

  const demo = await prisma.user.upsert({
    where: { email: "demo@lotline.local" },
    update: { passwordHash },
    create: {
      email: "demo@lotline.local",
      name: "Alex Rivera",
      role: "user",
      passwordHash,
    },
  });

  await prisma.savedSearch.upsert({
    where: { id: "seed-search-f250" },
    update: {},
    create: {
      id: "seed-search-f250",
      userId: demo.id,
      name: "F-250 under $40k within 100 miles",
      params: {
        make: "Ford",
        model: "F-250",
        category: "Vehicles",
        priceMax: 40000,
        location: "Salt Lake City",
        radius: 100,
      },
      notifyEmail: true,
    },
  });

  await prisma.savedSearch.upsert({
    where: { id: "seed-search-iphone" },
    update: {},
    create: {
      id: "seed-search-iphone",
      userId: demo.id,
      name: "iPhone 15 under $500",
      params: {
        category: "Electronics",
        make: "Apple",
        model: "iPhone 15",
        priceMax: 500,
      },
      notifyEmail: true,
    },
  });

  await prisma.savedSearch.upsert({
    where: { id: "seed-search-macbook" },
    update: {},
    create: {
      id: "seed-search-macbook",
      userId: demo.id,
      name: "MacBook Pro",
      params: {
        category: "Electronics",
        make: "Apple",
        model: "MacBook Pro 16",
      },
      notifyEmail: true,
    },
  });

  await prisma.savedSearch.upsert({
    where: { id: "seed-search-openbox" },
    update: {},
    create: {
      id: "seed-search-openbox",
      userId: demo.id,
      name: "Best Buy Open Box arbitrage",
      params: {
        source: "bestbuy",
        sort: "dealScore",
      },
      notifyEmail: true,
    },
  });

  await ingestSource("mock");
  await ingestSource("bestbuy");
  console.log("Seeded users, saved searches, mock listings, and Best Buy Open Box arbitrage.");
  console.log("Demo login: demo@lotline.local / LotlineDemo!2026");
  console.log("Admin login: admin@lotline.local / LotlineDemo!2026");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
