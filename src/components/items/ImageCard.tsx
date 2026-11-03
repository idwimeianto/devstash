import { Image as ImageIcon, Pin, Star } from "lucide-react";
import Image from "next/image";

import { DATE_FORMAT } from "@/components/dashboard/ItemCard";
import { OpenItemButton } from "@/components/items/OpenItemButton";
import { Card, CardContent } from "@/components/ui/card";
import { getSafeHref } from "@/lib/safe-url";
import type { ItemSummary } from "@/types/items";

// Matches the gallery: 1 column, 2 from md, 3 from xl inside the max-w-6xl page.
const THUMBNAIL_SIZES = "(min-width: 1280px) 384px, (min-width: 768px) 50vw, 100vw";

interface ImageCardProps {
  item: ItemSummary;
  // Above-the-fold thumbnails load eagerly so they don't delay LCP.
  eager?: boolean;
}

export function ImageCard({ item, eager = false }: ImageCardProps) {
  const src = item.fileUrl ? getSafeHref(item.fileUrl) : null;

  return (
    <Card className="relative gap-0 py-0 transition-colors hover:ring-foreground/25 has-focus-visible:ring-2 has-focus-visible:ring-ring">
      <OpenItemButton itemId={item.id} title={item.title} />
      <div className="relative aspect-video overflow-hidden bg-muted/40">
        {src ? (
          <Image
            src={src}
            alt={item.title}
            fill
            sizes={THUMBNAIL_SIZES}
            loading={eager ? "eager" : "lazy"}
            className="object-cover transition-transform duration-300 group-hover/card:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-8 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
      </div>
      <CardContent className="flex items-center gap-2 py-3">
        <h3 className="truncate font-medium">{item.title}</h3>
        {item.isPinned && <Pin className="size-3.5 shrink-0 text-muted-foreground" />}
        {item.isFavorite && (
          <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
        )}
        <time
          dateTime={item.date.toISOString()}
          className="ml-auto shrink-0 text-xs text-muted-foreground"
        >
          {DATE_FORMAT.format(item.date)}
        </time>
      </CardContent>
    </Card>
  );
}
