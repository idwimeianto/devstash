import type { Metadata } from "next";
import { Suspense } from "react";

import {
  FavoriteCollectionRow,
  FavoriteItemRow,
  FavoritesSection,
} from "@/components/favorites/FavoriteRows";
import { Skeleton } from "@/components/ui/skeleton";
import { getFavoriteCollections } from "@/lib/db/collections";
import { getFavoriteItems } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/users";

export const metadata: Metadata = {
  title: "Favorites · DevStash",
};

const PAGE_CLASSES = "mx-auto flex w-full max-w-4xl flex-col gap-8";

async function Favorites() {
  const userId = await getCurrentUserId();
  const [items, collections] = await Promise.all([
    getFavoriteItems(userId),
    getFavoriteCollections(userId),
  ]);

  if (items.length === 0 && collections.length === 0) {
    return (
      <p className="font-mono text-sm text-muted-foreground">
        No favorites yet. Star an item or a collection to see it here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8 font-mono text-sm">
      {items.length > 0 && (
        <FavoritesSection title="Items" count={items.length}>
          {items.map((item) => (
            <FavoriteItemRow key={item.id} item={item} />
          ))}
        </FavoritesSection>
      )}
      {collections.length > 0 && (
        <FavoritesSection title="Collections" count={collections.length}>
          {collections.map((collection) => (
            <FavoriteCollectionRow key={collection.id} collection={collection} />
          ))}
        </FavoritesSection>
      )}
    </div>
  );
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
