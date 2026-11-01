import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ItemStats, ItemSummary } from "@/types/items";

const RECENT_ITEMS_LIMIT = 10;

const ITEM_SUMMARY_SELECT = {
  id: true,
  title: true,
  description: true,
  isPinned: true,
  isFavorite: true,
  lastUsedAt: true,
  createdAt: true,
  type: { select: { name: true } },
  tags: { select: { name: true }, orderBy: { name: "asc" } },
} satisfies Prisma.ItemSelect;

// Most recently used first; never-used items follow, newest first.
const RECENT_ORDER = [
  { lastUsedAt: { sort: "desc", nulls: "last" } },
  { createdAt: "desc" },
] satisfies Prisma.ItemOrderByWithRelationInput[];

type ItemSummaryRow = Prisma.ItemGetPayload<{
  select: typeof ITEM_SUMMARY_SELECT;
}>;

function toItemSummary(item: ItemSummaryRow): ItemSummary {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    isPinned: item.isPinned,
    isFavorite: item.isFavorite,
    typeName: item.type.name,
    tags: item.tags.map((tag) => tag.name),
    date: item.lastUsedAt ?? item.createdAt,
  };
}

export async function getPinnedItems(userId: string): Promise<ItemSummary[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: RECENT_ORDER,
    select: ITEM_SUMMARY_SELECT,
  });
  return items.map(toItemSummary);
}

export async function getRecentItems(
  userId: string,
  limit = RECENT_ITEMS_LIMIT
): Promise<ItemSummary[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: RECENT_ORDER,
    take: limit,
    select: ITEM_SUMMARY_SELECT,
  });
  return items.map(toItemSummary);
}

export async function getItemStats(userId: string): Promise<ItemStats> {
  const [items, favoriteItems] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);
  return { items, favoriteItems };
}
