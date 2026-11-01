"use server";

import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import { signInSchema } from "@/lib/validations/auth";
import type { SignInState } from "@/types/auth";

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
      return {
        success: false,
        email,
        error:
          error.type === "CredentialsSignin"
            ? "Invalid email or password."
            : "Something went wrong. Please try again.",
      };
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
