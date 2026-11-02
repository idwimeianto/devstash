import { connection } from "next/server";
import { cache } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { UserProfile } from "@/types/profile";

// Matches no rows, so a missing session renders empty states instead of failing.
const NO_USER_ID = "";

// The signed-in user's id for data queries. The proxy redirects signed-out visitors,
// so the empty fallback only shows if a page outside its matcher calls this.
export const getCurrentUserId = cache(async (): Promise<string> => {
  return (await getSessionUserId()) ?? NO_USER_ID;
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
