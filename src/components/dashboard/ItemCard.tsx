import { Pin, Star } from "lucide-react";

import { CopyButton } from "@/components/code/CopyButton";
import { OpenItemButton } from "@/components/items/OpenItemButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getItemTypeDisplay } from "@/lib/item-type-display";
import { cn } from "@/lib/utils";
import type { ItemSummary } from "@/types/items";

export const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

interface ItemCardProps {
  item: ItemSummary;
}

export function ItemCard({ item }: ItemCardProps) {
  const { icon: Icon, textColor, borderColor, bgTint } = getItemTypeDisplay(
    item.typeName
  );

  return (
    <Card
      className={cn(
        "relative border-l-4 transition-colors hover:ring-foreground/25 has-focus-visible:ring-2 has-focus-visible:ring-ring",
        borderColor
      )}
    >
      <OpenItemButton itemId={item.id} title={item.title} />
      <CardContent className="flex items-start gap-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            bgTint
          )}
        >
          <Icon className={cn("size-5", textColor)} />
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
        <div className="flex shrink-0 flex-col items-end justify-between gap-2 self-stretch">
          <time
            dateTime={item.date.toISOString()}
            className="text-xs text-muted-foreground"
          >
            {DATE_FORMAT.format(item.date)}
          </time>
          {item.copyValue && (
            // Above the card's open button, so a click copies instead of opening the drawer.
            <CopyButton
              value={item.copyValue}
              label={`Copy ${item.title}`}
              className="relative z-20 -mr-1 -mb-1 text-muted-foreground"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
