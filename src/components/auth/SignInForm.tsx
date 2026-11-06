"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { signInWithCredentials } from "@/actions/auth";
import { FormField } from "@/components/auth/FormField";
import { GitHubAuthButton } from "@/components/auth/GitHubAuthButton";
import { Button } from "@/components/ui/button";

// Errors NextAuth adds to the sign-in URL, e.g. after a failed GitHub round trip.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email is already registered. Sign in with your email and password.",
  AccessDenied: "Access was denied. Please try again.",
};
const DEFAULT_AUTH_ERROR = "Sign in failed. Please try again.";

export function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";
  const urlError = searchParams.get("error");
  const passwordReset = searchParams.get("reset") === "1";

  const [state, formAction, pending] = useActionState(
    signInWithCredentials,
    null,
  );

  const error =
    state?.error ??
    (urlError && !state ? (AUTH_ERROR_MESSAGES[urlError] ?? DEFAULT_AUTH_ERROR) : null);

  return (
    <div className="grid gap-6">
      {passwordReset && !state && (
        <p
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400"
        >
          Password updated. Sign in with your new password.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <GitHubAuthButton label="Sign in with GitHub" callbackUrl={callbackUrl} />

      <form action={formAction} className="grid gap-4" noValidate>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          defaultValue={state?.email}
          errors={state?.fieldErrors?.email}
          required
        />
        <div className="grid gap-2">
          <FormField
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            errors={state?.fieldErrors?.password}
            required
          />
          <Link
            href="/forgot-password"
            className="inline-flex min-h-8 items-center justify-self-end text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="inline-flex min-h-8 items-center text-foreground underline-offset-4 hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
