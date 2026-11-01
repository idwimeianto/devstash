// Item queries over the mock data. Swap these for Prisma queries once items move to the database.

import { ITEMS, ITEM_TYPES, type Item, type ItemType } from "@/lib/mock-data";

const RECENT_ITEMS_LIMIT = 10;

export interface ItemStats {
  items: number;
  favoriteItems: number;
}

export function getItemStats(): ItemStats {
  return {
    items: ITEMS.length,
    favoriteItems: ITEMS.filter((item) => item.isFavorite).length,
  };
}

export function getItemType(typeId: string): ItemType | undefined {
  return ITEM_TYPES.find((type) => type.id === typeId);
}

export function getPinnedItems(): Item[] {
  return ITEMS.filter((item) => item.isPinned);
}

export function getRecentItems(): Item[] {
  return ITEMS.toSorted((a, b) =>
    (b.lastUsedAt ?? b.createdAt).localeCompare(a.lastUsedAt ?? a.createdAt)
  ).slice(0, RECENT_ITEMS_LIMIT);
}
