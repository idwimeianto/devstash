import { Star } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { FavoritesList } from "@/components/favorites/FavoritesList";
import { Skeleton } from "@/components/ui/skeleton";
import { getFavoriteCollections } from "@/lib/db/collections";
import { getFavoriteItems } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/users";

export const metadata: Metadata = {
  title: "Favorites · DevStash",
};

const PAGE_CLASSES = "flex flex-col gap-10";

async function Favorites() {
  const userId = await getCurrentUserId();
  const [items, collections] = await Promise.all([
    getFavoriteItems(userId),
    getFavoriteCollections(userId),
  ]);

  if (items.length === 0 && collections.length === 0) {
    return (
      <EmptyState
        icon={Star}
        message="No favorites yet. Star an item or a collection to see it here."
      />
    );
  }

  return <FavoritesList items={items} collections={collections} />;
}

function FavoritesSkeleton() {
  return (
    <div className="grid gap-1.5">
      <Skeleton className="h-4 w-24" />
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-7 w-full" />
      ))}
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <div className={PAGE_CLASSES}>
      <header>
        <h1 className="text-3xl font-semibold">Favorites</h1>
        <p className="mt-1 text-muted-foreground">Your starred items and collections</p>
      </header>
      {/* Favorites are per user, so they stream in at request time. */}
      <Suspense fallback={<FavoritesSkeleton />}>
        <Favorites />
      </Suspense>
    </div>
  );
}
