import { Star } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import {
  getCollectionItems,
  getCollectionMainType,
  getCollectionTypeIds,
  getItemType,
} from "@/lib/dashboard";
import { getItemTypeDisplay } from "@/lib/item-type-display";
import type { Collection } from "@/lib/mock-data";

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const mainType = getCollectionMainType(collection);
  const { borderColor, bgTint } = getItemTypeDisplay(mainType?.name ?? "");
  const itemCount = getCollectionItems(collection.id).length;
  const typeIds = getCollectionTypeIds(collection.id);

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
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
          {collection.description && (
            <p className="mt-2 line-clamp-2 text-muted-foreground">
              {collection.description}
            </p>
          )}
          <div className="mt-auto flex gap-2 pt-3">
            {typeIds.map((typeId) => {
              const type = getItemType(typeId);
              const { icon: Icon, textColor } = getItemTypeDisplay(
                type?.name ?? ""
              );
              return <Icon key={typeId} className={`size-4 ${textColor}`} />;
            })}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
