import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { EditorPreferencesProvider } from "@/components/code/EditorPreferencesProvider";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { MissingAccount } from "@/components/profile/MissingAccount";
import { BillingCard, type CheckoutResult } from "@/components/settings/BillingCard";
import { EditorPreferencesForm } from "@/components/settings/EditorPreferencesForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getBillingSummary } from "@/lib/billing";
import { getUserBilling } from "@/lib/db/billing";
import { getCollectionStats } from "@/lib/db/collections";
import { getItemStats } from "@/lib/db/items";
import { getEditorPreferences, getSessionUserId, getUserProfile } from "@/lib/db/users";
import type { BillingSummary } from "@/types/billing";

export const metadata: Metadata = {
  title: "Settings · DevStash",
};

// Where Stripe Checkout sent the user back from, if anywhere.
function parseCheckoutResult(value: string | string[] | undefined): CheckoutResult {
  return value === "success" || value === "cancelled" ? value : null;
}

// Billing details come from Stripe when there's a subscription, falling back to the database.
async function loadBilling(userId: string): Promise<BillingSummary | null> {
  const billing = await getUserBilling(userId);
  return billing ? getBillingSummary(billing) : null;
}

async function SettingsContent({ searchParams }: { searchParams: PageProps<"/settings">["searchParams"] }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/sign-in?callbackUrl=/settings");

  const [profile, editorPreferences, billing, itemStats, collectionStats, params] =
    await Promise.all([
      getUserProfile(userId),
      getEditorPreferences(userId),
      loadBilling(userId),
      getItemStats(userId),
      getCollectionStats(userId),
      searchParams,
    ]);
  if (!profile || !billing) return <MissingAccount />;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Editor preferences</CardTitle>
          <CardDescription>Applies to every code editor. Changes save automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditorPreferencesProvider preferencesPromise={Promise.resolve(editorPreferences)}>
            <EditorPreferencesForm />
          </EditorPreferencesProvider>
        </CardContent>
      </Card>

      {/* Stripe's return URLs end in #billing, so the card needs room under the top of the page. */}
      <Card id="billing" className="scroll-mt-6">
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Your plan and payments. Payments are handled by Stripe.</CardDescription>
        </CardHeader>
        <CardContent>
          <BillingCard
            summary={billing}
            usage={{ items: itemStats.items, collections: collectionStats.collections }}
            checkout={parseCheckoutResult(params.checkout)}
          />
        </CardContent>
      </Card>

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
      <Skeleton className="h-96 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </>
  );
}

export default function SettingsPage({ searchParams }: PageProps<"/settings">) {
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
        <SettingsContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
