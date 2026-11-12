"use client";

import { useSearchParams } from "next/navigation";
import { useActionState, useId, useState } from "react";

import { signInWithCredentials } from "@/actions/auth";
import { AuthLink, AuthMutedLink } from "@/components/auth/AuthLinks";
import { FormField } from "@/components/auth/FormField";
import { GitHubAuthButton } from "@/components/auth/GitHubAuthButton";
import { StatusMessage } from "@/components/common/StatusMessage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DEMO_ACCOUNT } from "@/lib/demo-account";

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

  const demoId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Checked only while both fields hold the demo values, so editing either one unchecks it.
  const isDemo =
    email === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password;

  function toggleDemo(checked: boolean) {
    setEmail(checked ? DEMO_ACCOUNT.email : "");
    setPassword(checked ? DEMO_ACCOUNT.password : "");
  }

  const error =
    state?.error ??
    (urlError && !state
      ? (AUTH_ERROR_MESSAGES[urlError] ?? DEFAULT_AUTH_ERROR)
      : null);

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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          errors={state?.fieldErrors?.email}
          required
        />
        <div className="grid gap-2">
          <FormField
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            errors={state?.fieldErrors?.password}
            required
          />
          <AuthMutedLink href="/forgot-password" className="justify-self-end">
            Forgot password?
          </AuthMutedLink>
        </div>
        <div className="flex min-h-8 items-center gap-2">
          <Checkbox id={demoId} checked={isDemo} onCheckedChange={toggleDemo} />
          <Label htmlFor={demoId} className="font-normal text-muted-foreground">
            Use demo account
          </Label>
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
