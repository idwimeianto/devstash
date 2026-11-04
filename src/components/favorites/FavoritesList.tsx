"use client";

import { usePathname, useSearchParams } from "next/navigation";

import {
  FavoriteCollectionRow,
  FavoriteItemRow,
  FavoritesSection,
} from "@/components/favorites/FavoriteRows";
import { FavoritesSortControl } from "@/components/favorites/FavoritesSortControl";
import {
  getFavoriteSortSearch,
  getNextFavoriteSort,
  parseFavoriteSort,
  sortFavorites,
  type FavoriteSortKey,
} from "@/lib/favorites-sort";
import type { FavoriteCollection } from "@/types/collections";
import type { FavoriteItem } from "@/types/items";

interface FavoritesListProps {
  items: FavoriteItem[];
  collections: FavoriteCollection[];
}

export function FavoritesList({ items, collections }: FavoritesListProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = parseFavoriteSort(searchParams.get("sort"), searchParams.get("dir"));

  const sortedItems = sortFavorites(items, sort, (item) => ({
    name: item.title,
    typeName: item.typeName,
    date: item.updatedAt,
  }));
  const sortedCollections = sortFavorites(collections, sort, (collection) => ({
    name: collection.name,
    typeName: collection.mainTypeName,
    date: collection.updatedAt,
  }));

  function selectSort(key: FavoriteSortKey) {
    const search = getFavoriteSortSearch(
      new URLSearchParams(searchParams.toString()),
      getNextFavoriteSort(sort, key)
    );
    // Replaces the URL without a navigation; Next.js syncs useSearchParams with it.
    window.history.replaceState(null, "", `${pathname}${search}`);
  }

  return (
    <div className="flex flex-col gap-3 font-mono text-sm">
      <div className="flex justify-end">
        <FavoritesSortControl sort={sort} onSelect={selectSort} />
      </div>
      <div className="flex flex-col gap-8">
        {sortedItems.length > 0 && (
          <FavoritesSection title="Items" count={sortedItems.length}>
            {sortedItems.map((item) => (
              <FavoriteItemRow key={item.id} item={item} />
            ))}
          </FavoritesSection>
        )}
        {sortedCollections.length > 0 && (
          <FavoritesSection title="Collections" count={sortedCollections.length}>
            {sortedCollections.map((collection) => (
              <FavoriteCollectionRow key={collection.id} collection={collection} />
            ))}
          </FavoritesSection>
        )}
      </div>
    </div>
  );
}
