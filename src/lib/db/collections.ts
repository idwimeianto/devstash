import { prisma } from "@/lib/prisma";
import type {
  CollectionStats,
  CollectionSummary,
  CollectionTypeSummary,
} from "@/types/collections";

const RECENT_COLLECTIONS_LIMIT = 6;

const TYPE_SELECT = { id: true, name: true, icon: true, color: true } as const;

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

export async function getRecentCollections(
  userId: string,
  limit = RECENT_COLLECTIONS_LIMIT
): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      defaultType: { select: { name: true } },
      items: { select: { item: { select: { type: { select: TYPE_SELECT } } } } },
    },
  });

  return collections.map((collection) => {
    const types = rankTypes(collection.items.map(({ item }) => item.type));
    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      itemCount: collection.items.length,
      types,
      mainTypeName: types[0]?.name ?? collection.defaultType?.name ?? null,
    };
  });
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
