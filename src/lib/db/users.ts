import { connection } from "next/server";
import { cache } from "react";

import { auth } from "@/auth";
import { DEFAULT_EDITOR_PREFERENCES, parseEditorPreferences } from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";
import type { EditorPreferences } from "@/types/editor-preferences";
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

// The defaults when signed out, never set, or the account is gone.
export async function getEditorPreferences(userId: string | null): Promise<EditorPreferences> {
  if (!userId) return DEFAULT_EDITOR_PREFERENCES;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });
  return parseEditorPreferences(user?.editorPreferences);
}

// The signed-in user's preferences, for the editor context.
export async function getSessionEditorPreferences(): Promise<EditorPreferences> {
  return getEditorPreferences(await getSessionUserId());
}

// False when the user no longer exists.
export async function updateEditorPreferences(
  userId: string,
  preferences: EditorPreferences,
): Promise<boolean> {
  const { count } = await prisma.user.updateMany({
    where: { id: userId },
    data: { editorPreferences: preferences },
  });
  return count > 0;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true, createdAt: true, password: true },
  });
  if (!user) return null;

  const { password, ...profile } = user;
  return { ...profile, hasPassword: password !== null };
}
