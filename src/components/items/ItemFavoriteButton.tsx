"use client";

import { Star } from "lucide-react";

import { setItemFavorite } from "@/actions/items";
import { Button } from "@/components/ui/button";
import { useOptimisticToggle } from "@/hooks/use-optimistic-toggle";
import { cn } from "@/lib/utils";

interface ItemFavoriteButtonProps {
  itemId: string;
  title: string;
  isFavorite: boolean;
}

// The star on item cards and rows. Sits above the card's open button, so a click toggles
// the favorite instead of opening the drawer.
export function ItemFavoriteButton({ itemId, title, isFavorite: saved }: ItemFavoriteButtonProps) {
  const { checked: isFavorite, toggle } = useOptimisticToggle(saved, (next) =>
    setItemFavorite(itemId, next),
  );

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={`Favorite ${title}`}
      aria-pressed={isFavorite}
      onClick={toggle}
      className="relative z-20 shrink-0"
    >
      <Star
        className={cn(isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
      />
    </Button>
  );
}
