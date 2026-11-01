import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import {
  BCRYPT_ROUNDS,
  DEMO_USER,
  SEED_COLLECTIONS,
  SYSTEM_TYPES,
  type SeedItem,
} from "./seed-data";

// The seed wipes the demo user's data and sets a known password.
if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed: NODE_ENV is production.");
  process.exit(1);
}

// Nested creates over a remote connection can outlast the 5s default.
const TRANSACTION_TIMEOUT_MS = 30_000;

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
    isPinned: item.isPinned ?? false,
    userId,
    typeId,
  };
}

function getTypeId(typeIds: Map<string, string>, typeName: string): string {
  const typeId = typeIds.get(typeName);
  if (!typeId) throw new Error(`Unknown item type in seed data: "${typeName}"`);
  return typeId;
}

// Recreates the demo user's collections and items so re-running the seed
// always leaves the same data. Join rows cascade when items/collections go.
async function seedCollections(
  tx: Prisma.TransactionClient,
  userId: string,
  typeIds: Map<string, string>
) {
  await tx.item.deleteMany({ where: { userId } });
  await tx.collection.deleteMany({ where: { userId } });

  for (const collection of SEED_COLLECTIONS) {
    await tx.collection.create({
      data: {
        name: collection.name,
        description: collection.description,
        isFavorite: collection.isFavorite ?? false,
        userId,
        defaultTypeId: getTypeId(typeIds, collection.defaultType),
        items: {
          create: collection.items.map((item) => ({
            item: {
              create: toItemData(item, userId, getTypeId(typeIds, item.type)),
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
  await prisma.$transaction((tx) => seedCollections(tx, user.id, typeIds), {
    timeout: TRANSACTION_TIMEOUT_MS,
  });

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
