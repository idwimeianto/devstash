"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { signInWithCredentials } from "@/actions/auth";
import { AuthLink, AuthMutedLink } from "@/components/auth/AuthLinks";
import { FormField } from "@/components/auth/FormField";
import { GitHubAuthButton } from "@/components/auth/GitHubAuthButton";
import { StatusMessage } from "@/components/common/StatusMessage";
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
        <StatusMessage tone="success">
          Password updated. Sign in with your new password.
        </StatusMessage>
      )}
      {error && <StatusMessage tone="error">{error}</StatusMessage>}

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
          <AuthMutedLink href="/forgot-password" className="justify-self-end">
            Forgot password?
          </AuthMutedLink>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <AuthLink href="/register">Register</AuthLink>
      </p>
    </div>
  );
}
