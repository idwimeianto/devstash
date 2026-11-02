import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetLinkError } from "@/components/auth/ResetLinkError";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPasswordResetTokenStatus } from "@/lib/db/verification-tokens";

export const metadata: Metadata = {
  title: "Reset password · DevStash",
};

async function ResetPasswordContent({
  searchParams,
}: Pick<PageProps<"/reset-password">, "searchParams">) {
  const { token: tokenParam } = await searchParams;
  const token = typeof tokenParam === "string" ? tokenParam : "";
  const status = token ? await getPasswordResetTokenStatus(token) : "invalid";

  if (status !== "valid") {
    return (
      <Card>
        <CardContent className="py-2">
          <ResetLinkError status={status} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Choose a new password</CardTitle>
        <CardDescription>Use at least 8 characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    // The token comes from the URL's search params, which aren't known at build time.
    <Suspense>
      <ResetPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}
