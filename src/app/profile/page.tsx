import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
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
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>
      <header>
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="mt-1 text-muted-foreground">Your profile and usage</p>
      </header>

      {/* The profile is the signed-in user's, so it streams in at request time. */}
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </main>
  );
}
