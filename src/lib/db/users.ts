import { connection } from "next/server";
import { cache } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { UserProfile } from "@/types/profile";

const DEMO_USER_EMAIL = "demo@devstash.io";

// Matches no rows, so an unseeded database renders empty states instead of failing.
const NO_USER_ID = "";

// Temporary until Auth.js is in place: every request acts as the seeded demo user.
// Cached per request so the dashboard's server components share one lookup.
export const getCurrentUserId = cache(async (): Promise<string> => {
  // User data is per request; keep it (and the queries that depend on it) out of prerendering.
  await connection();
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });
  return user?.id ?? NO_USER_ID;
});

// The signed-in user's id, or null when signed out.
export const getSessionUserId = cache(async (): Promise<string | null> => {
  // NextAuth calls crypto.getRandomValues(), which can't run during prerendering.
  await connection();
  const session = await auth();
  return session?.user?.id ?? null;
});

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true, createdAt: true, password: true },
  });
  if (!user) return null;

  const { password, ...profile } = user;
  return { ...profile, hasPassword: password !== null };
}
