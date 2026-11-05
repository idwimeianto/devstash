import type { Metadata } from "next";
import { Suspense } from "react";

import { UpgradePlans } from "@/components/billing/UpgradePlans";
import { MissingAccount } from "@/components/profile/MissingAccount";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserBilling } from "@/lib/db/billing";
import { getCurrentUserId } from "@/lib/db/users";
import { getUpgradeStatus } from "@/lib/usage-limits";

export const metadata: Metadata = {
  title: "Upgrade · DevStash",
};

async function Plans() {
  const user = await getUserBilling(await getCurrentUserId());
  if (!user) return <MissingAccount />;
  return <UpgradePlans status={getUpgradeStatus(user)} />;
}

function PlansSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Skeleton className="h-96 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

export default function UpgradePage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold">Upgrade to Pro</h1>
        <p className="mt-1 text-muted-foreground">
          Unlimited items and collections, file and image uploads, and AI features.
        </p>
      </header>
      {/* The plan is per user, so it streams in at request time. */}
      <Suspense fallback={<PlansSkeleton />}>
        <Plans />
      </Suspense>
    </div>
  );
}
