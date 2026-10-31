import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../src/generated/prisma/client";

const SYSTEM_TYPES = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "link", icon: "Link", color: "#10b981" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
];

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

// System types have a null userId, which a compound unique `where` can't match,
// so look each one up first to keep the seed safe to re-run.
async function seedSystemTypes() {
  for (const type of SYSTEM_TYPES) {
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, userId: null },
    });

    if (existing) {
      await prisma.itemType.update({
        where: { id: existing.id },
        data: { icon: type.icon, color: type.color, isSystem: true },
      });
    } else {
      await prisma.itemType.create({ data: { ...type, isSystem: true } });
    }
  }
}

async function main() {
  await seedSystemTypes();
  console.log(`Seeded ${SYSTEM_TYPES.length} system item types`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
