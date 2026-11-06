"use client";

import { useActionState } from "react";

import { changePassword } from "@/actions/profile";
import { FormField } from "@/components/auth/FormField";
import { StatusMessage } from "@/components/common/StatusMessage";
import { Button } from "@/components/ui/button";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, null);

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {state?.success && <StatusMessage tone="success">{state.data?.message}</StatusMessage>}
      {state?.error && <StatusMessage tone="error">{state.error}</StatusMessage>}

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
