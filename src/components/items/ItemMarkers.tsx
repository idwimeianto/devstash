import { Pin } from "lucide-react";

import { ItemFavoriteButton } from "@/components/items/ItemFavoriteButton";
import type { ItemSummary } from "@/types/items";

interface ItemMarkersProps {
  item: Pick<ItemSummary, "id" | "title" | "isPinned" | "isFavorite">;
}

// The pin icon and favorite toggle shown after an item's title on cards and rows.
export function ItemMarkers({ item }: ItemMarkersProps) {
  return (
    <>
      {item.isPinned && <Pin className="size-3.5 shrink-0 text-muted-foreground" />}
      <ItemFavoriteButton itemId={item.id} title={item.title} isFavorite={item.isFavorite} />
    </>
  );
}
