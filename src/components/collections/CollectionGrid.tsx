import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { CollectionSummary } from "@/types/collections";

const GRID_CLASSES = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";
const SKELETON_COUNT = 6;

interface CollectionGridProps {
  collections: CollectionSummary[];
}

export function CollectionGrid({ collections }: CollectionGridProps) {
  if (collections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No collections yet. Create one to group related items.
      </p>
    );
  }

  return (
    <div className={GRID_CLASSES}>
      {collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  );
}

export function CollectionGridSkeleton() {
  return (
    <div className={GRID_CLASSES}>
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <Skeleton key={i} className="h-40 rounded-xl" />
      ))}
    </div>
  );
}
