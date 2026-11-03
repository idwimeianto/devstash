import { Pin, Star } from "lucide-react";

interface ItemMarkersProps {
  isPinned: boolean;
  isFavorite: boolean;
}

// The pin and favorite icons shown after an item's title on cards and rows.
export function ItemMarkers({ isPinned, isFavorite }: ItemMarkersProps) {
  return (
    <>
      {isPinned && <Pin className="size-3.5 shrink-0 text-muted-foreground" />}
      {isFavorite && <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />}
    </>
  );
}
