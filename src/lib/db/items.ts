import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ItemStats,
  ItemSummary,
  ItemTypeWithCount,
} from "@/types/items";

const RECENT_ITEMS_LIMIT = 10;
const PINNED_ITEMS_LIMIT = 10;

// Sidebar order for the system types; any other type follows, by name.
const SYSTEM_TYPE_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

function typeRank(name: string): number {
  const index = SYSTEM_TYPE_ORDER.indexOf(name);
  return index === -1 ? SYSTEM_TYPE_ORDER.length : index;
}

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
    take: PINNED_ITEMS_LIMIT,
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

// System types plus the user's custom types, each with the user's item count.
export async function getItemTypesWithCounts(
  userId: string
): Promise<ItemTypeWithCount[]> {
  const types = await prisma.itemType.findMany({
    where: { OR: [{ isSystem: true }, { userId }] },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: { select: { items: { where: { userId } } } },
    },
  });

  return types
    .toSorted((a, b) => typeRank(a.name) - typeRank(b.name))
    .map((type) => ({
      id: type.id,
      name: type.name,
      itemCount: type._count.items,
    }));
}

export async function getItemStats(userId: string): Promise<ItemStats> {
  const [items, favoriteItems] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);
  return { items, favoriteItems };
}
