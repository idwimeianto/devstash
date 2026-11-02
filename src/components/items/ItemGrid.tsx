import { ItemCard } from "@/components/dashboard/ItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { ItemSummary } from "@/types/items";

const GRID_CLASSES = "grid gap-3 md:grid-cols-2";
const SKELETON_COUNT = 6;

interface ItemGridProps {
  items: ItemSummary[];
  emptyMessage: string;
}

export function ItemGrid({ items, emptyMessage }: ItemGridProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className={GRID_CLASSES}>
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
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
