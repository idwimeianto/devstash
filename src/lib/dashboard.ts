// Dashboard queries over the mock data. Swap these for Prisma queries once the database exists.

import {
  COLLECTIONS,
  ITEMS,
  ITEM_TYPES,
  type Collection,
  type Item,
  type ItemType,
} from "@/lib/mock-data";

const RECENT_COLLECTIONS_LIMIT = 6;
const RECENT_ITEMS_LIMIT = 10;

export interface DashboardStats {
  items: number;
  collections: number;
  favoriteItems: number;
  favoriteCollections: number;
}

export function getDashboardStats(): DashboardStats {
  return {
    items: ITEMS.length,
    collections: COLLECTIONS.length,
    favoriteItems: ITEMS.filter((item) => item.isFavorite).length,
    favoriteCollections: COLLECTIONS.filter((c) => c.isFavorite).length,
  };
}

export function getItemType(typeId: string): ItemType | undefined {
  return ITEM_TYPES.find((type) => type.id === typeId);
}

export function getCollectionItems(collectionId: string): Item[] {
  return ITEMS.filter((item) => item.collectionIds.includes(collectionId));
}

// Type ids in a collection, most common first.
export function getCollectionTypeIds(collectionId: string): string[] {
  const counts = new Map<string, number>();
  for (const item of getCollectionItems(collectionId)) {
    counts.set(item.typeId, (counts.get(item.typeId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .toSorted((a, b) => b[1] - a[1])
    .map(([typeId]) => typeId);
}

// The type a collection holds most of, falling back to its default type when empty.
export function getCollectionMainType(
  collection: Collection
): ItemType | undefined {
  const typeId =
    getCollectionTypeIds(collection.id)[0] ?? collection.defaultTypeId;
  return typeId ? getItemType(typeId) : undefined;
}

export function getRecentCollections(): Collection[] {
  return COLLECTIONS.toSorted((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  ).slice(0, RECENT_COLLECTIONS_LIMIT);
}

export function getPinnedItems(): Item[] {
  return ITEMS.filter((item) => item.isPinned);
}

export function getRecentItems(): Item[] {
  return ITEMS.toSorted((a, b) =>
    (b.lastUsedAt ?? b.createdAt).localeCompare(a.lastUsedAt ?? a.createdAt)
  ).slice(0, RECENT_ITEMS_LIMIT);
}
