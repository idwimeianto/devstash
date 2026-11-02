"use client";

import { useActionState } from "react";

import { changePassword } from "@/actions/profile";
import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, null);

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {state?.success && (
        <p
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400"
        >
          {state.data?.message}
        </p>
      )}
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <FormField
        name="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
        errors={state?.fieldErrors?.currentPassword}
        required
      />
      <FormField
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        errors={state?.fieldErrors?.password}
        required
      />
      <FormField
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        errors={state?.fieldErrors?.confirmPassword}
        required
      />
      <Button type="submit" className="justify-self-start" disabled={pending}>
        {pending ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
