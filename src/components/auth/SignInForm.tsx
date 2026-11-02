"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { signInWithCredentials, signInWithGitHub } from "@/actions/auth";
import { FormField } from "@/components/auth/FormField";
import { GitHubIcon } from "@/components/auth/GitHubIcon";
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

  const [state, formAction, pending] = useActionState(
    signInWithCredentials,
    null,
  );

  const error =
    state?.error ??
    (urlError && !state ? (AUTH_ERROR_MESSAGES[urlError] ?? DEFAULT_AUTH_ERROR) : null);

  return (
    <div className="grid gap-6">
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <form action={signInWithGitHub}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Button type="submit" variant="outline" className="w-full">
          <GitHubIcon />
          Sign in with GitHub
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

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
        <FormField
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          errors={state?.fieldErrors?.password}
          required
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-foreground underline-offset-4 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
