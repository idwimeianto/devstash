import { Prisma } from "@/generated/prisma/client";
import { getItemContentType } from "@/lib/item-fields";
import {
  DASHBOARD_RECENT_ITEMS_LIMIT,
  ITEMS_PER_PAGE,
  type Page,
  paginate,
} from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { toContentPreview } from "@/lib/search";
import type { CreateItemData, UpdateItemData } from "@/lib/validations/items";
import type {
  CollectionSection,
  FavoriteItem,
  ItemDetail,
  ItemStats,
  ItemSummary,
  ItemTypeRef,
  ItemTypeWithCount,
} from "@/types/items";
import type { SearchItem } from "@/types/search";
import type { UploadedFile } from "@/types/uploads";

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
  content: true,
  url: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
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
    copyValue: item.url || item.content || null,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    date: item.lastUsedAt ?? item.createdAt,
    createdAt: item.createdAt,
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
  limit = DASHBOARD_RECENT_ITEMS_LIMIT
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

// The ids of the user's tags with these names, creating the ones the user doesn't have yet.
async function ensureTags(
  tx: Prisma.TransactionClient,
  userId: string,
  tags: string[]
): Promise<{ id: string }[]> {
  // Tags are unique per user, so this only creates the missing ones.
  await tx.tag.createMany({
    data: tags.map((name) => ({ name, userId })),
    skipDuplicates: true,
  });
  return tx.tag.findMany({
    where: { userId, name: { in: tags } },
    select: { id: true },
  });
}

// CreateItemData with the upload's size checked against R2.
export type CreateItemRecord = Omit<CreateItemData, "file"> & { file?: UploadedFile };

// Creates the item with one of the system types; fields left undefined stay empty.
export async function createItem(
  userId: string,
  { typeName, tags, file, collectionIds = [], ...fields }: CreateItemRecord
): Promise<ItemDetail> {
  const item = await prisma.$transaction(async (tx) => {
    const type = await tx.itemType.findFirst({
      where: { name: typeName, isSystem: true },
      select: { id: true },
    });
    if (!type) throw new Error(`Unknown system item type "${typeName}"`);

    const tagIds = await ensureTags(tx, userId, tags);
    return tx.item.create({
      data: {
        ...fields,
        ...file,
        contentType: getItemContentType(typeName),
        userId,
        typeId: type.id,
        tags: { connect: tagIds },
        collections: { create: collectionIds.map((collectionId) => ({ collectionId })) },
      },
      select: ITEM_DETAIL_SELECT,
    });
  });
  return toItemDetail(item);
}

// The query's result, or null when the record it updates or deletes doesn't exist (P2025),
// e.g. because the `where` also requires the user's id.
async function nullIfNotFound<T>(query: Promise<T>): Promise<T | null> {
  try {
    return await query;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return null;
    }
    throw error;
  }
}

// Makes the item's collections exactly these: deselected links are removed, new ones
// created, and the ones kept stay untouched (so their addedAt is kept).
function collectionLinks(
  collectionIds: string[]
): Prisma.ItemCollectionUpdateManyWithoutItemNestedInput {
  return {
    deleteMany: { collectionId: { notIn: collectionIds } },
    createMany: {
      data: collectionIds.map((collectionId) => ({ collectionId })),
      skipDuplicates: true,
    },
  };
}

// Fields left undefined in data stay as they are. Returns null if the item isn't the user's.
export async function updateItem(
  userId: string,
  itemId: string,
  { tags, collectionIds, ...fields }: UpdateItemData
): Promise<ItemDetail | null> {
  const item = await nullIfNotFound(
    prisma.$transaction(async (tx) => {
      const tagIds = await ensureTags(tx, userId, tags);

      // set replaces the item's tags: old ones are disconnected, the new ones connected.
      return tx.item.update({
        where: { id: itemId, userId },
        data: {
          ...fields,
          tags: { set: tagIds },
          ...(collectionIds && { collections: collectionLinks(collectionIds) }),
        },
        select: ITEM_DETAIL_SELECT,
      });
    })
  );
  return item && toItemDetail(item);
}

// Collection and tag links go with the item; the tags themselves stay.
// Returns the deleted item's file URL (so its upload can be removed), or null if the
// item is missing or isn't the user's.
export function deleteItem(
  userId: string,
  itemId: string
): Promise<{ fileUrl: string | null } | null> {
  return nullIfNotFound(
    prisma.item.delete({ where: { id: itemId, userId }, select: { fileUrl: true } })
  );
}

// Whether one of the user's items still points at this uploaded file.
export async function isFileUrlInUse(userId: string, fileUrl: string): Promise<boolean> {
  const count = await prisma.item.count({ where: { userId, fileUrl } });
  return count > 0;
}

// The stored file of one of the user's file or image items, or null.
export async function getItemFile(
  userId: string,
  itemId: string
): Promise<{ fileUrl: string; fileName: string | null } | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId, contentType: "FILE" },
    select: { fileUrl: true, fileName: true },
  });
  return item?.fileUrl ? { fileUrl: item.fileUrl, fileName: item.fileName } : null;
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

// One page of the matching items, recent first, with the total count.
function findItemsPage(where: Prisma.ItemWhereInput, page: number): Promise<Page<ItemSummary>> {
  return paginate(
    page,
    ITEMS_PER_PAGE,
    () => prisma.item.count({ where }),
    async (skip, take) => {
      const items = await prisma.item.findMany({
        where,
        orderBy: RECENT_ORDER,
        skip,
        take,
        select: ITEM_SUMMARY_SELECT,
      });
      return items.map(toItemSummary);
    }
  );
}

export function getItemsByType(
  userId: string,
  typeId: string,
  page: number
): Promise<Page<ItemSummary>> {
  return findItemsPage({ userId, typeId }, page);
}

// Which of the collection page's sections a query fills.
const COLLECTION_SECTION_TYPES = {
  items: { name: { notIn: ["file", "image"] } },
  files: { name: "file" },
  images: { name: "image" },
} satisfies Record<CollectionSection, Prisma.ItemTypeWhereInput>;

export function getItemsByCollection(
  userId: string,
  collectionId: string,
  section: CollectionSection,
  page: number
): Promise<Page<ItemSummary>> {
  return findItemsPage(
    {
      userId,
      collections: { some: { collectionId } },
      type: COLLECTION_SECTION_TYPES[section],
    },
    page
  );
}

// Every favorite item of the user, most recently updated first.
export async function getFavoriteItems(userId: string): Promise<FavoriteItem[]> {
  const items = await prisma.item.findMany({
    where: { userId, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true, type: { select: { name: true } } },
  });
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    typeName: item.type.name,
    updatedAt: item.updatedAt,
  }));
}

// Every item of the user, recent first, in the light shape the command palette searches.
export async function getSearchItems(userId: string): Promise<SearchItem[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: RECENT_ORDER,
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      url: true,
      fileName: true,
      type: { select: { name: true } },
    },
  });
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    typeName: item.type.name,
    preview: toContentPreview(item.description, item.content, item.url, item.fileName),
  }));
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
