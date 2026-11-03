import {
  COLLECTIONS_PER_PAGE,
  DASHBOARD_COLLECTIONS_LIMIT,
  type Page,
  paginate,
} from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import type {
  CreateCollectionData,
  UpdateCollectionData,
} from "@/lib/validations/collections";
import type {
  CollectionOption,
  CollectionRef,
  CollectionStats,
  CollectionSummary,
  CollectionTypeSummary,
  CreatedCollection,
  SidebarCollection,
  SidebarCollections,
} from "@/types/collections";

const SIDEBAR_RECENT_LIMIT = 5;

const TYPE_SELECT = { id: true, name: true, icon: true, color: true } as const;

// What both collection queries need to work out item counts and the main type.
const ITEM_TYPES_SELECT = {
  defaultType: { select: { name: true } },
  items: { select: { item: { select: { type: { select: TYPE_SELECT } } } } },
} as const;

interface CollectionWithItemTypes {
  defaultType: { name: string } | null;
  items: { item: { type: CollectionTypeSummary } }[];
}

// Unique types across the given items, most-used first.
function rankTypes(types: CollectionTypeSummary[]): CollectionTypeSummary[] {
  const counts = new Map<string, { type: CollectionTypeSummary; count: number }>();
  for (const type of types) {
    const entry = counts.get(type.id);
    if (entry) entry.count += 1;
    else counts.set(type.id, { type, count: 1 });
  }
  return [...counts.values()]
    .toSorted((a, b) => b.count - a.count)
    .map(({ type }) => type);
}

// Item count, types by use, and the main type, falling back to the default type when empty.
function summarizeItemTypes({ defaultType, items }: CollectionWithItemTypes) {
  const types = rankTypes(items.map(({ item }) => item.type));
  return {
    itemCount: items.length,
    types,
    mainTypeName: types[0]?.name ?? defaultType?.name ?? null,
  };
}

// Newest first; every collection when `take` is undefined.
async function findCollectionSummaries(
  userId: string,
  take?: number,
  skip?: number
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    skip,
    select: { id: true, name: true, description: true, isFavorite: true, ...ITEM_TYPES_SELECT },
  });

  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    ...summarizeItemTypes(collection),
  }));
}

export function getRecentCollections(
  userId: string,
  limit = DASHBOARD_COLLECTIONS_LIMIT
): Promise<CollectionSummary[]> {
  return findCollectionSummaries(userId, limit);
}

// Every collection, for the command palette's search.
export function getAllCollections(userId: string): Promise<CollectionSummary[]> {
  return findCollectionSummaries(userId);
}

// One page of the /collections grid, newest first.
export function getCollectionsPage(
  userId: string,
  page: number
): Promise<Page<CollectionSummary>> {
  return paginate(
    page,
    COLLECTIONS_PER_PAGE,
    () => prisma.collection.count({ where: { userId } }),
    (skip, take) => findCollectionSummaries(userId, take, skip)
  );
}

// One of the user's collections; another user's collection looks missing.
export function getCollection(
  userId: string,
  collectionId: string
): Promise<CollectionRef | null> {
  return prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true, name: true, description: true, isFavorite: true },
  });
}

export async function getSidebarCollections(
  userId: string
): Promise<SidebarCollections> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, isFavorite: true, ...ITEM_TYPES_SELECT },
  });

  const toSidebarCollection = (
    collection: (typeof collections)[number]
  ): SidebarCollection => {
    const { itemCount, mainTypeName } = summarizeItemTypes(collection);
    return { id: collection.id, name: collection.name, itemCount, mainTypeName };
  };

  return {
    favorites: collections
      .filter((collection) => collection.isFavorite)
      .map(toSidebarCollection),
    recent: collections
      .filter((collection) => !collection.isFavorite)
      .slice(0, SIDEBAR_RECENT_LIMIT)
      .map(toSidebarCollection),
  };
}

export async function getCollectionStats(
  userId: string
): Promise<CollectionStats> {
  const [collections, favoriteCollections] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);
  return { collections, favoriteCollections };
}

export async function createCollection(
  userId: string,
  data: CreateCollectionData
): Promise<CreatedCollection> {
  return prisma.collection.create({
    data: { userId, name: data.name, description: data.description ?? null },
    select: { id: true, name: true, description: true },
  });
}

// The updated collection, or null when it isn't one of the user's collections.
export async function updateCollection(
  userId: string,
  collectionId: string,
  data: UpdateCollectionData
): Promise<CreatedCollection | null> {
  const description = data.description ?? null;
  const { count } = await prisma.collection.updateMany({
    where: { id: collectionId, userId },
    data: { name: data.name, description },
  });
  return count === 0 ? null : { id: collectionId, name: data.name, description };
}

// Whether the user's collection was deleted. Its item links cascade; the items stay.
export async function deleteCollection(userId: string, collectionId: string): Promise<boolean> {
  const { count } = await prisma.collection.deleteMany({
    where: { id: collectionId, userId },
  });
  return count > 0;
}

// All of the user's collections by name, for the item forms' collection picker.
export async function getCollectionOptions(userId: string): Promise<CollectionOption[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    select: { id: true, name: true },
  });
  // Sorted here: Postgres would put lowercase names after every capitalized one.
  return collections.toSorted((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" })
  );
}

// Whether every one of these ids is one of the user's collections.
export async function areUserCollections(
  userId: string,
  collectionIds: string[]
): Promise<boolean> {
  if (collectionIds.length === 0) return true;
  const count = await prisma.collection.count({
    where: { userId, id: { in: collectionIds } },
  });
  return count === collectionIds.length;
}
