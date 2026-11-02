"use server";

import { z } from "zod";

import { signOut } from "@/auth";
import { getSessionUserId } from "@/lib/db/users";
import { deleteTokensForEmail } from "@/lib/db/verification-tokens";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations/auth";
import type { ChangePasswordState, DeleteAccountState } from "@/types/profile";

const NOT_SIGNED_IN = "You're not signed in. Please sign in again.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

export async function changePassword(
  _prevState: ChangePasswordState | null,
  formData: FormData,
): Promise<ChangePasswordState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { success: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  // Always the session's user, never an id from the form.
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    if (!user?.password) {
      return { success: false, error: "This account signs in with GitHub and has no password." };
    }
    if (!(await verifyPassword(parsed.data.currentPassword, user.password))) {
      return {
        success: false,
        fieldErrors: { currentPassword: ["Current password is incorrect"] },
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: await hashPassword(parsed.data.password) },
    });
  } catch (error) {
    console.error("Password change failed", error);
    return { success: false, error: GENERIC_ERROR };
  }

  return { success: true, data: { message: "Password updated." } };
}

export async function deleteAccount(): Promise<DeleteAccountState> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (user) {
      // Items, collections, tags, custom types and accounts cascade from the user;
      // verification tokens aren't linked to it, so they're removed by email.
      await prisma.$transaction([
        deleteTokensForEmail(user.email),
        prisma.user.delete({ where: { id: userId } }),
      ]);
    }
  } catch (error) {
    console.error("Account deletion failed", error);
    return { success: false, error: GENERIC_ERROR };
  }

  // Throws Next.js's redirect, so it stays outside the try.
  await signOut({ redirectTo: "/sign-in" });
  return { success: true };
}
