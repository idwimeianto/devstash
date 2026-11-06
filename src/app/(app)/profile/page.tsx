import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { MissingAccount } from "@/components/profile/MissingAccount";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { Skeleton } from "@/components/ui/skeleton";
import { getCollectionStats } from "@/lib/db/collections";
import { getItemStats, getItemTypesWithCounts } from "@/lib/db/items";
import { getSessionUserId, getUserProfile } from "@/lib/db/users";

export const metadata: Metadata = {
  title: "Profile · DevStash",
};

async function ProfileContent() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/sign-in?callbackUrl=/profile");

  const [profile, itemStats, collectionStats, types] = await Promise.all([
    getUserProfile(userId),
    getItemStats(userId),
    getCollectionStats(userId),
    getItemTypesWithCounts(userId),
  ]);
  if (!profile) return <MissingAccount />;

  return (
    <>
      <ProfileInfo profile={profile} />
      <ProfileStats
        items={itemStats.items}
        collections={collectionStats.collections}
        types={types}
      />
    </>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
    </>
  );
}

export default function ProfilePage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="mt-1 text-muted-foreground">Your profile and usage</p>
      </header>

      {/* The profile is the signed-in user's, so it streams in at request time. */}
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
