import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { UpdateItemData } from "@/lib/validations/items";
import type {
  ItemDetail,
  ItemStats,
  ItemSummary,
  ItemTypeRef,
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

const ITEM_DETAIL_SELECT = {
  id: true,
  title: true,
  description: true,
  contentType: true,
  content: true,
  language: true,
  url: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  isPinned: true,
  isFavorite: true,
  createdAt: true,
  updatedAt: true,
  type: { select: { name: true } },
  tags: { select: { name: true }, orderBy: { name: "asc" } },
  collections: {
    select: { collection: { select: { id: true, name: true } } },
    orderBy: { collection: { name: "asc" } },
  },
} satisfies Prisma.ItemSelect;

type ItemDetailRow = Prisma.ItemGetPayload<{ select: typeof ITEM_DETAIL_SELECT }>;

function toItemDetail({ type, tags, collections, ...fields }: ItemDetailRow): ItemDetail {
  return {
    ...fields,
    typeName: type.name,
    tags: tags.map((tag) => tag.name),
    collections: collections.map(({ collection }) => collection),
  };
}

// Filtering by userId makes another user's item look missing.
export async function getItemDetail(
  userId: string,
  itemId: string
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: ITEM_DETAIL_SELECT,
  });
  return item && toItemDetail(item);
}

// The item's type name, or null when the item is missing or belongs to another user.
export async function getItemTypeName(
  userId: string,
  itemId: string
): Promise<string | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { type: { select: { name: true } } },
  });
  return item?.type.name ?? null;
}

// Fields left undefined in data stay as they are. Returns null if the item isn't the user's.
export async function updateItem(
  userId: string,
  itemId: string,
  { tags, ...fields }: UpdateItemData
): Promise<ItemDetail | null> {
  try {
    const item = await prisma.$transaction(async (tx) => {
      // Tags are unique per user, so this only creates the ones the user doesn't have yet.
      await tx.tag.createMany({
        data: tags.map((name) => ({ name, userId })),
        skipDuplicates: true,
      });
      const tagIds = await tx.tag.findMany({
        where: { userId, name: { in: tags } },
        select: { id: true },
      });

      // set replaces the item's tags: old ones are disconnected, the new ones connected.
      return tx.item.update({
        where: { id: itemId, userId },
        data: { ...fields, tags: { set: tagIds } },
        select: ITEM_DETAIL_SELECT,
      });
    });
    return toItemDetail(item);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return null;
    }
    throw error;
  }
}

// Collection and tag links go with the item; the tags themselves stay.
// Returns false if the item is missing or isn't the user's.
export async function deleteItem(userId: string, itemId: string): Promise<boolean> {
  try {
    await prisma.item.delete({ where: { id: itemId, userId }, select: { id: true } });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return false;
    }
    throw error;
  }
}

// Resolves a plural route slug ("snippets") to a system type or one of the user's custom types.
export async function getItemTypeBySlug(
  userId: string,
  slug: string
): Promise<ItemTypeRef | null> {
  if (!slug.endsWith("s")) return null;
  return prisma.itemType.findFirst({
    where: { name: slug.slice(0, -1), OR: [{ isSystem: true }, { userId }] },
    select: { id: true, name: true },
  });
}

export async function getItemsByType(
  userId: string,
  typeId: string
): Promise<ItemSummary[]> {
  const items = await prisma.item.findMany({
    where: { userId, typeId },
    orderBy: RECENT_ORDER,
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
