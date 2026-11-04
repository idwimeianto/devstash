"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FAVORITE_SORT_KEYS, type FavoriteSort, type FavoriteSortKey } from "@/lib/favorites-sort";
import { cn } from "@/lib/utils";

const SORT_LABELS: Record<FavoriteSortKey, string> = {
  name: "Name",
  date: "Date",
  type: "Type",
};

interface FavoritesSortControlProps {
  sort: FavoriteSort;
  onSelect: (key: FavoriteSortKey) => void;
}

export function FavoritesSortControl({ sort, onSelect }: FavoritesSortControlProps) {
  return (
    <div
      role="group"
      aria-label="Sort favorites"
      className="flex items-center gap-0.5 rounded-lg border border-border/50 p-0.5"
    >
      {FAVORITE_SORT_KEYS.map((key) => {
        const active = sort.key === key;
        const Arrow = sort.direction === "asc" ? ArrowUp : ArrowDown;

        return (
          <Button
            key={key}
            type="button"
            variant="ghost"
            size="xs"
            aria-pressed={active}
            onClick={() => onSelect(key)}
            className={cn(
              "font-mono text-muted-foreground",
              active && "bg-muted text-foreground dark:bg-muted"
            )}
          >
            {SORT_LABELS[key]}
            {active && (
              <>
                <Arrow data-icon="inline-end" aria-hidden />
                <span className="sr-only">
                  ({sort.direction === "asc" ? "ascending" : "descending"})
                </span>
              </>
            )}
          </Button>
        );
      })}
    </div>
  );
}
