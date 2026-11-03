import { prisma } from "@/lib/prisma";
import type { CreateCollectionData } from "@/lib/validations/collections";
import type {
  CollectionOption,
  CollectionStats,
  CollectionSummary,
  CollectionTypeSummary,
  CreatedCollection,
  SidebarCollection,
  SidebarCollections,
} from "@/types/collections";

const RECENT_COLLECTIONS_LIMIT = 6;
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

export async function getRecentCollections(
  userId: string,
  limit = RECENT_COLLECTIONS_LIMIT
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
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
