"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordReset } from "@/actions/auth";
import { FormField } from "@/components/auth/FormField";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, null);

  if (state?.success) {
    return (
      <div className="grid justify-items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-400">
          <MailCheck className="size-6" />
        </div>
        <div className="grid gap-2">
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            If an account exists for{" "}
            <span className="font-medium text-foreground">{state.data?.email}</span>, we&apos;ve
            sent a reset link. The link expires in 1 hour.
          </p>
        </div>
        <Link href="/sign-in" className={cn(buttonVariants({ variant: "outline" }), "mt-2 w-full")}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <form action={formAction} className="grid gap-4" noValidate>
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          defaultValue={state?.email}
          errors={state?.fieldErrors?.email}
          required
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/sign-in"
          className="inline-flex min-h-8 items-center text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
