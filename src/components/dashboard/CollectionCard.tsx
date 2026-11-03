import { Star } from "lucide-react";
import Link from "next/link";

import { CollectionCardMenu } from "@/components/collections/CollectionCardMenu";
import { Card, CardContent } from "@/components/ui/card";
import { getItemTypeDisplay } from "@/lib/item-type-display";
import { cn } from "@/lib/utils";
import type { CollectionSummary } from "@/types/collections";

interface CollectionCardProps {
  collection: CollectionSummary;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const { borderColor, bgTint } = getItemTypeDisplay(collection.mainTypeName);

  return (
    <Card
      className={cn(
        "relative h-full border-l-4 transition-colors hover:ring-foreground/25 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
        borderColor,
        bgTint
      )}
    >
      {/* Covers the card, so a click anywhere but the menu opens the collection. */}
      <Link
        href={`/collections/${collection.id}`}
        className="absolute inset-0 z-10 outline-none"
      >
        <span className="sr-only">Open {collection.name}</span>
      </Link>
      <CardContent className="flex h-full flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{collection.name}</h3>
          {collection.isFavorite && (
            <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
          <div className="ml-auto">
            <CollectionCardMenu collection={collection} />
          </div>
        </div>
        <p className="text-muted-foreground">
          {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
        </p>
        {collection.description && (
          <p className="mt-2 line-clamp-2 text-muted-foreground">
            {collection.description}
          </p>
        )}
        <div className="mt-auto flex gap-2 pt-3">
          {collection.types.map((type) => {
            const { icon: Icon, textColor } = getItemTypeDisplay(type.name);
            return (
              <Icon
                key={type.id}
                className={cn("size-4", textColor)}
                aria-label={type.name}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
