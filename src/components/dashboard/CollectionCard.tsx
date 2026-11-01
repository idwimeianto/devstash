import { Star } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { getItemTypeDisplay } from "@/lib/item-type-display";
import type { CollectionSummary } from "@/types/collections";

interface CollectionCardProps {
  collection: CollectionSummary;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const { borderColor, bgTint } = getItemTypeDisplay(
    collection.mainTypeName ?? ""
  );

  return (
    <Link href={`/collections/${collection.id}`} className="group/collection">
      <Card
        className={`h-full border-l-4 transition-colors group-hover/collection:ring-foreground/25 ${borderColor} ${bgTint}`}
      >
        <CardContent className="flex h-full flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{collection.name}</h3>
            {collection.isFavorite && (
              <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
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
                  className={`size-4 ${textColor}`}
                  aria-label={type.name}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
