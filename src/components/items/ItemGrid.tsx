import { ItemCard } from "@/components/dashboard/ItemCard";
import { ImageCard } from "@/components/items/ImageCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { ItemSummary } from "@/types/items";

const GRID_CLASSES = "grid gap-3 md:grid-cols-2 xl:grid-cols-3";
const SKELETON_COUNT = 6;
// The first row at the widest layout.
const EAGER_IMAGE_COUNT = 3;

interface ItemGridProps {
  items: ItemSummary[];
  emptyMessage: string;
  // Images show as a gallery of thumbnail cards.
  gallery?: boolean;
}

export function ItemGrid({ items, emptyMessage, gallery = false }: ItemGridProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className={GRID_CLASSES}>
      {items.map((item, index) =>
        gallery ? (
          <ImageCard key={item.id} item={item} eager={index < EAGER_IMAGE_COUNT} />
        ) : (
          <ItemCard key={item.id} item={item} />
        )
      )}
    </div>
  );
}

export function ItemGridSkeleton() {
  return (
    <div className={GRID_CLASSES}>
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <Skeleton key={i} className="h-[5.5rem] rounded-xl" />
      ))}
    </div>
  );
}
