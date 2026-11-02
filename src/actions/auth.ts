"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { SignInRateLimitedError, signIn, signOut } from "@/auth";
import { getAppUrl } from "@/lib/app-url";
import {
  createPasswordResetToken,
  resetPasswordWithToken,
  type ResetPasswordResult,
} from "@/lib/db/verification-tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, getRateLimitMessage } from "@/lib/rate-limit";
import {
  EMAIL_NOT_VERIFIED,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
} from "@/lib/validations/auth";
import type { ForgotPasswordState, ResetPasswordState, SignInState } from "@/types/auth";

const DEFAULT_REDIRECT = "/dashboard";

// Only same-site paths, so a crafted callbackUrl can't send users to another site.
function getRedirectTo(value: FormDataEntryValue | null) {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  ) {
    return value;
  }
  return DEFAULT_REDIRECT;
}

function getSignInErrorMessage(error: AuthError) {
  if (error instanceof SignInRateLimitedError) {
    return getRateLimitMessage(error.reset);
  }
  if (error instanceof CredentialsSignin) {
    return error.code === EMAIL_NOT_VERIFIED
      ? "Please verify your email first. Check your inbox for the verification link."
      : "Invalid email or password.";
  }
  return "Something went wrong. Please try again.";
}

export async function signInWithCredentials(
  _prevState: SignInState | null,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const email = String(formData.get("email") ?? "");

  if (!parsed.success) {
    return {
      success: false,
      email,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: getRedirectTo(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, email, error: getSignInErrorMessage(error) };
    }
    // A successful sign-in throws Next.js's redirect, which must propagate.
    throw error;
  }

  return { success: true };
}

export async function signInWithGitHub(formData: FormData) {
  await signIn("github", {
    redirectTo: getRedirectTo(formData.get("callbackUrl")),
  });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/sign-in" });
}

// Always reports success for a valid email, so the response doesn't reveal which emails
// are registered. Only users with a password get a reset link.
export async function requestPasswordReset(
  _prevState: ForgotPasswordState | null,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "");
  const parsed = forgotPasswordSchema.safeParse({ email });

  if (!parsed.success) {
    return {
      success: false,
      email,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const limit = await checkRateLimit("forgotPassword", getClientIp(await headers()));
  if (!limit.success) {
    return { success: false, email, error: getRateLimitMessage(limit.reset) };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { password: true },
    });

    if (user?.password) {
      const token = await createPasswordResetToken(parsed.data.email);
      await sendPasswordResetEmail(
        parsed.data.email,
        `${getAppUrl()}/reset-password?token=${token}`,
      );
    }
  } catch (error) {
    // Reporting the failure would reveal that the account exists.
    console.error("Password reset request failed", error);
  }

  return { success: true, data: { email: parsed.data.email } };
}

export async function resetPassword(
  _prevState: ResetPasswordState | null,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    if (fieldErrors.token) return { success: false, linkStatus: "invalid" };
    return { success: false, fieldErrors };
  }

  const limit = await checkRateLimit("resetPassword", getClientIp(await headers()));
  if (!limit.success) {
    return { success: false, error: getRateLimitMessage(limit.reset) };
  }

  let result: ResetPasswordResult;
  try {
    result = await resetPasswordWithToken(
      parsed.data.token,
      await hashPassword(parsed.data.password),
    );
  } catch (error) {
    console.error("Password reset failed", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  if (result !== "reset") {
    return { success: false, linkStatus: result };
  }

  redirect("/sign-in?reset=1");
}
