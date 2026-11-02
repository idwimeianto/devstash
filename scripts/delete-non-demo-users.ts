// Deletes every user except the demo user, along with all of their content.
// Accounts, sessions, items, collections, custom item types and tags are removed
// by the schema's cascading deletes; verification tokens aren't linked to users,
// so every token not issued to the demo email is deleted too.
//
// Dry run (lists what would be deleted): npm run db:delete-users
// Delete for real:                       npm run db:delete-users -- --confirm

import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";

import { DEMO_USER } from "../prisma/seed-data";
import { PrismaClient } from "../src/generated/prisma/client";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to delete users: NODE_ENV is production.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env first.");
  process.exit(1);
}

const confirmed = process.argv.includes("--confirm");

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const demo = await prisma.user.findUnique({
    where: { email: DEMO_USER.email },
    select: { id: true },
  });
  if (!demo) {
    throw new Error(`Demo user ${DEMO_USER.email} not found. Run npm run db:seed first.`);
  }

  const users = await prisma.user.findMany({
    where: { id: { not: demo.id } },
    orderBy: { createdAt: "asc" },
    select: {
      email: true,
      name: true,
      _count: { select: { items: true, collections: true, accounts: true } },
    },
  });
  const tokenCount = await prisma.verificationToken.count({
    where: { identifier: { not: DEMO_USER.email } },
  });

  console.log(`Database host: ${new URL(process.env.DATABASE_URL!).hostname}`);
  console.log(`Keeping: ${DEMO_USER.email}\n`);

  if (users.length === 0 && tokenCount === 0) {
    console.log("Nothing to delete.");
    return;
  }

  console.table(
    users.map(({ email, name, _count }) => ({
      email,
      name,
      items: _count.items,
      collections: _count.collections,
      accounts: _count.accounts,
    })),
  );
  console.log(`Verification tokens: ${tokenCount}\n`);

  if (!confirmed) {
    console.log("Dry run, nothing deleted. Re-run with --confirm to delete the above.");
    return;
  }

  const [deletedUsers, deletedTokens] = await prisma.$transaction([
    prisma.user.deleteMany({ where: { id: { not: demo.id } } }),
    prisma.verificationToken.deleteMany({
      where: { identifier: { not: DEMO_USER.email } },
    }),
  ]);

  console.log(
    `Deleted ${deletedUsers.count} users and ${deletedTokens.count} verification tokens.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
