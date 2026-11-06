import type { ReactNode } from "react";

import { ItemCard } from "@/components/dashboard/ItemCard";
import { FileRow } from "@/components/items/FileRow";
import { ImageCard } from "@/components/items/ImageCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { ItemSummary } from "@/types/items";

const GRID_CLASSES = "grid gap-3 md:grid-cols-2 xl:grid-cols-3";
const SKELETON_COUNT = 6;
// The first row at the widest layout.
const EAGER_IMAGE_COUNT = 3;

// Images show as a gallery of thumbnail cards, files as a list of rows.
export type ItemGridLayout = "cards" | "gallery" | "list";

interface ItemGridProps {
  items: ItemSummary[];
  // Shown when there are no items.
  empty?: ReactNode;
  layout?: ItemGridLayout;
}

export function ItemGrid({ items, empty = null, layout = "cards" }: ItemGridProps) {
  if (items.length === 0) return empty;

  if (layout === "list") {
    // A minmax(0, 1fr) column so long, truncated names can't widen the page.
    return (
      <ul className="grid grid-cols-1 divide-y overflow-hidden rounded-xl border bg-card">
        {items.map((item) => (
          <FileRow key={item.id} item={item} />
        ))}
      </ul>
    );
  }

  const gallery = layout === "gallery";
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
