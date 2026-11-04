import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { MissingAccount } from "@/components/profile/MissingAccount";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionUserId, getUserProfile } from "@/lib/db/users";

export const metadata: Metadata = {
  title: "Settings · DevStash",
};

async function SettingsContent() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/sign-in?callbackUrl=/settings");

  const profile = await getUserProfile(userId);
  if (!profile) return <MissingAccount />;

  return (
    <>
      {/* GitHub-only accounts have no password to change. */}
      {profile.hasPassword && (
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Use at least 8 characters.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      )}

      <Card className="ring-destructive/30">
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>
            Permanently delete your account and everything in it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog />
        </CardContent>
      </Card>
    </>
  );
}

function SettingsSkeleton() {
  return (
    <>
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </>
  );
}

export default function SettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>
      <header>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account</p>
      </header>

      {/* The account is the signed-in user's, so it streams in at request time. */}
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </main>
  );
}
