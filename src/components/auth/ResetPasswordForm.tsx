"use client";

import { useActionState } from "react";

import { resetPassword } from "@/actions/auth";
import { FormField } from "@/components/auth/FormField";
import { ResetLinkError } from "@/components/auth/ResetLinkError";
import { StatusMessage } from "@/components/common/StatusMessage";
import { Button } from "@/components/ui/button";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(resetPassword, null);

  // The link can expire or be used in another tab while this form is open.
  if (state?.linkStatus) {
    return <ResetLinkError status={state.linkStatus} />;
  }

  return (
    <div className="grid gap-6">
      {state?.error && <StatusMessage tone="error">{state.error}</StatusMessage>}

      <form action={formAction} className="grid gap-4" noValidate>
        <input type="hidden" name="token" value={token} />
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
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
