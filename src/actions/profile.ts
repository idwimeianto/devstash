"use server";

import { z } from "zod";

import { signOut } from "@/auth";
import { cancelSubscription } from "@/lib/billing";
import { getSessionUserId } from "@/lib/db/users";
import { deleteTokensForEmail } from "@/lib/db/verification-tokens";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { GENERIC_ERROR, NOT_SIGNED_IN } from "@/lib/messages";
import { deleteObject, getKeyFromPublicUrl } from "@/lib/r2";
import { changePasswordSchema } from "@/lib/validations/auth";
import type { ChangePasswordState, DeleteAccountState } from "@/types/profile";

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

// The account is gone either way; files left behind in R2 are only logged.
async function deleteUploadedFiles(fileUrls: string[]) {
  const keys = fileUrls.map(getKeyFromPublicUrl).filter((key) => key !== null);
  const results = await Promise.allSettled(keys.map((key) => deleteObject(key)));
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Deleting an account's file from R2 failed", result.reason);
    }
  }
}

export async function deleteAccount(): Promise<DeleteAccountState> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  let fileUrls: string[] = [];
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        stripeSubscriptionId: true,
        items: { where: { fileUrl: { not: null } }, select: { fileUrl: true } },
      },
    });
    if (user) {
      // Canceled first: if Stripe fails, the account stays so it isn't billed after deletion.
      if (user.stripeSubscriptionId) await cancelSubscription(user.stripeSubscriptionId);

      fileUrls = user.items.flatMap((item) => (item.fileUrl ? [item.fileUrl] : []));
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

  // Uploads aren't in the database, so the cascade doesn't remove them.
  await deleteUploadedFiles(fileUrls);

  // Throws Next.js's redirect, so it stays outside the try.
  await signOut({ redirectTo: "/sign-in" });
  return { success: true };
}
