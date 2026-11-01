import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  DEMO_USER,
  SEED_COLLECTIONS,
  SYSTEM_TYPES,
  type SeedItem,
} from "./seed-data";

const BCRYPT_ROUNDS = 12;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

// System types have a null userId, which a compound unique `where` can't match,
// so look each one up first. Returns a map of type name to id.
async function seedSystemTypes(): Promise<Map<string, string>> {
  const typeIds = new Map<string, string>();

  for (const type of SYSTEM_TYPES) {
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, userId: null },
    });
    const saved = existing
      ? await prisma.itemType.update({
          where: { id: existing.id },
          data: { icon: type.icon, color: type.color, isSystem: true },
        })
      : await prisma.itemType.create({ data: { ...type, isSystem: true } });
    typeIds.set(type.name, saved.id);
  }

  return typeIds;
}

async function seedDemoUser() {
  const password = await bcrypt.hash(DEMO_USER.password, BCRYPT_ROUNDS);
  const data = {
    name: DEMO_USER.name,
    password,
    isPro: false,
    emailVerified: new Date(),
  };

  return prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: data,
    create: { email: DEMO_USER.email, ...data },
  });
}

function toItemData(item: SeedItem, userId: string, typeId: string) {
  return {
    title: item.title,
    description: item.description,
    contentType: item.type === "link" ? ("URL" as const) : ("TEXT" as const),
    content: item.content ?? null,
    language: item.language ?? null,
    url: item.url ?? null,
    userId,
    typeId,
  };
}

// Recreates the demo user's collections and items so re-running the seed
// always leaves the same data. Join rows cascade when items/collections go.
async function seedCollections(userId: string, typeIds: Map<string, string>) {
  await prisma.item.deleteMany({ where: { userId } });
  await prisma.collection.deleteMany({ where: { userId } });

  for (const collection of SEED_COLLECTIONS) {
    await prisma.collection.create({
      data: {
        name: collection.name,
        description: collection.description,
        userId,
        defaultTypeId: typeIds.get(collection.defaultType),
        items: {
          create: collection.items.map((item) => ({
            item: {
              create: toItemData(item, userId, typeIds.get(item.type)!),
            },
          })),
        },
      },
    });
  }
}

async function main() {
  const typeIds = await seedSystemTypes();
  const user = await seedDemoUser();
  await seedCollections(user.id, typeIds);

  const itemCount = SEED_COLLECTIONS.reduce((n, c) => n + c.items.length, 0);
  console.log(
    `Seeded ${typeIds.size} system types, demo user ${user.email}, ` +
      `${SEED_COLLECTIONS.length} collections and ${itemCount} items`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
