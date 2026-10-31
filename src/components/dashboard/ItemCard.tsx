import { Pin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getItemType } from "@/lib/dashboard";
import { getItemTypeDisplay } from "@/lib/item-type-display";
import type { Item } from "@/lib/mock-data";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const type = getItemType(item.typeId);
  const { icon: Icon, textColor, borderColor, bgTint } = getItemTypeDisplay(
    type?.name ?? ""
  );
  const date = DATE_FORMAT.format(new Date(item.lastUsedAt ?? item.createdAt));

  return (
    <Card
      className={`cursor-pointer border-l-4 transition-colors hover:ring-foreground/25 ${borderColor}`}
    >
      <CardContent className="flex items-start gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${bgTint}`}
        >
          <Icon className={`size-5 ${textColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{item.title}</h3>
            {item.isPinned && (
              <Pin className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            {item.isFavorite && (
              <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </div>
          {item.description && (
            <p className="mt-1 truncate text-muted-foreground">
              {item.description}
            </p>
          )}
          {item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <time
          dateTime={item.lastUsedAt ?? item.createdAt}
          className="shrink-0 text-xs text-muted-foreground"
        >
          {date}
        </time>
      </CardContent>
    </Card>
  );
}
