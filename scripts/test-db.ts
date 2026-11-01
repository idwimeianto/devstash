// Checks the database connection, prints the demo data and verifies it matches the seed.
// Run with: npm run db:test (after npm run db:seed)

import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

import {
  BCRYPT_ROUNDS,
  DEMO_USER,
  SEED_COLLECTIONS,
  SYSTEM_TYPES,
} from "../prisma/seed-data";
import { PrismaClient } from "../src/generated/prisma/client";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env first.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

const failures: string[] = [];

function check(label: string, passed: boolean) {
  console.log(`${passed ? "✔" : "✘"} ${label}`);
  if (!passed) failures.push(label);
}

function fetchDemoUser() {
  return prisma.user.findUnique({
    where: { email: DEMO_USER.email },
    include: {
      collections: {
        orderBy: { createdAt: "asc" },
        include: {
          defaultType: true,
          items: {
            orderBy: { addedAt: "asc" },
            include: { item: { include: { type: true } } },
          },
        },
      },
    },
  });
}

type DemoUser = NonNullable<Awaited<ReturnType<typeof fetchDemoUser>>>;

async function printConnection() {
  const [{ version }] = await prisma.$queryRaw<
    { version: string }[]
  >`SELECT version()`;
  console.log("Connected:", version.split(",")[0]);

  const [users, itemTypes, items, collections, tags] = await Promise.all([
    prisma.user.count(),
    prisma.itemType.count(),
    prisma.item.count(),
    prisma.collection.count(),
    prisma.tag.count(),
  ]);
  console.table({ users, itemTypes, items, collections, tags });
}

function printDemoData(user: DemoUser) {
  console.log(`\nDemo user: ${user.name} <${user.email}>`);
  console.log(
    `  isPro: ${user.isPro}, email verified: ${user.emailVerified?.toISOString() ?? "no"}`
  );

  for (const collection of user.collections) {
    console.log(
      `\n📁 ${collection.name} — ${collection.description} ` +
        `(${collection.items.length} items, default type: ${collection.defaultType?.name ?? "none"})`
    );
    console.table(
      collection.items.map(({ item }) => ({
        type: item.type.name,
        title: item.title,
        contentType: item.contentType,
        language: item.language ?? "",
        url: item.url ?? "",
      }))
    );
  }
}

async function checkSystemTypes() {
  const systemTypes = await prisma.itemType.findMany({
    where: { isSystem: true, userId: null },
  });
  check(
    `${SYSTEM_TYPES.length} system item types`,
    systemTypes.length === SYSTEM_TYPES.length
  );
  check(
    "system type icons and colors match the seed",
    SYSTEM_TYPES.every((expected) =>
      systemTypes.some(
        (t) =>
          t.name === expected.name &&
          t.icon === expected.icon &&
          t.color === expected.color
      )
    )
  );
}

async function checkDemoUser(user: DemoUser) {
  check(`demo user name is "${DEMO_USER.name}"`, user.name === DEMO_USER.name);
  check("demo user is not Pro", !user.isPro);
  check("demo user email is verified", user.emailVerified !== null);
  check(
    `demo password matches and uses ${BCRYPT_ROUNDS} bcrypt rounds`,
    user.password !== null &&
      (await bcrypt.compare(DEMO_USER.password, user.password)) &&
      bcrypt.getRounds(user.password) === BCRYPT_ROUNDS
  );
}

function checkCollections(user: DemoUser) {
  check(
    `${SEED_COLLECTIONS.length} collections`,
    user.collections.length === SEED_COLLECTIONS.length
  );

  for (const expected of SEED_COLLECTIONS) {
    const collection = user.collections.find((c) => c.name === expected.name);
    const titles = collection?.items.map(({ item }) => item.title) ?? [];
    check(
      `${expected.name}: ${expected.items.length} items with the seeded titles`,
      titles.length === expected.items.length &&
        expected.items.every((item) => titles.includes(item.title))
    );
  }
}

function checkItemContent(user: DemoUser) {
  const items = user.collections.flatMap((c) => c.items.map(({ item }) => item));
  check(
    "links are URL items with an https url",
    items
      .filter((item) => item.type.name === "link")
      .every((item) => item.contentType === "URL" && item.url?.startsWith("https://"))
  );
  check(
    "snippets, prompts and commands are TEXT items with content",
    items
      .filter((item) => item.type.name !== "link")
      .every((item) => item.contentType === "TEXT" && Boolean(item.content))
  );
}

async function main() {
  await printConnection();

  const user = await fetchDemoUser();
  if (!user) {
    check(`demo user ${DEMO_USER.email} exists (run npm run db:seed)`, false);
    return;
  }

  printDemoData(user);

  console.log("\nChecks:");
  await checkSystemTypes();
  await checkDemoUser(user);
  checkCollections(user);
  checkItemContent(user);
}

main()
  .catch((error) => {
    console.error("Database test failed:", error);
    failures.push("unexpected error");
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (failures.length > 0) {
      console.error(`\n${failures.length} check(s) failed.`);
      process.exitCode = 1;
    } else {
      console.log("\nAll checks passed.");
    }
  });
