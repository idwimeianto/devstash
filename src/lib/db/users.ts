import { connection } from "next/server";

import { prisma } from "@/lib/prisma";

const DEMO_USER_EMAIL = "demo@devstash.io";

// Temporary until Auth.js is in place: every request acts as the seeded demo user.
export async function getCurrentUserId(): Promise<string> {
  // User data is per request; keep it (and the queries that depend on it) out of prerendering.
  await connection();
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });
  return user.id;
}
