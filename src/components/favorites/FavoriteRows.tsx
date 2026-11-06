import { Folder } from "lucide-react";
import Link from "next/link";
import { createElement, type ReactNode } from "react";

import { OpenItemButton } from "@/components/items/OpenItemButton";
import { Badge } from "@/components/ui/badge";
import { SHORT_DATE_WITH_YEAR } from "@/lib/format-date";
import { getItemTypeDisplay } from "@/lib/item-type-display";
import { cn } from "@/lib/utils";
import type { FavoriteCollection } from "@/types/collections";
import type { FavoriteItem } from "@/types/items";

const ROW_CLASSES =
  "relative flex items-center gap-3 px-2 py-1.5 transition-colors hover:bg-muted/40 has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-inset";

interface FavoritesSectionProps {
  title: string;
  count: number;
  children: ReactNode;
}

export function FavoritesSection({ title, count, children }: FavoritesSectionProps) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {title} <span className="text-muted-foreground/70">({count})</span>
      </h2>
      <ul className="grid grid-cols-1 divide-y divide-border/50 border-y border-border/50">
        {children}
      </ul>
    </section>
  );
}

function TypeBadge({ typeName }: { typeName: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("shrink-0 font-mono text-[10px]", getItemTypeDisplay(typeName).textColor)}
    >
      {typeName}
    </Badge>
  );
}

function FavoriteDate({ date }: { date: Date }) {
  return (
    <time
      dateTime={date.toISOString()}
      className="hidden w-24 shrink-0 text-right text-muted-foreground sm:block"
    >
      {SHORT_DATE_WITH_YEAR.format(date)}
    </time>
  );
}

export function FavoriteItemRow({ item }: { item: FavoriteItem }) {
  const { icon, textColor } = getItemTypeDisplay(item.typeName);

  return (
    <li className={ROW_CLASSES}>
      <OpenItemButton itemId={item.id} title={item.title} />
      {/* The icon is a static lucide component picked by type. */}
      {createElement(icon, { className: cn("size-4 shrink-0", textColor), "aria-hidden": true })}
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      <TypeBadge typeName={item.typeName} />
      <FavoriteDate date={item.updatedAt} />
    </li>
  );
}

export function FavoriteCollectionRow({ collection }: { collection: FavoriteCollection }) {
  const { textColor } = getItemTypeDisplay(collection.mainTypeName);

  return (
    <li className={ROW_CLASSES}>
      <Link href={`/collections/${encodeURIComponent(collection.id)}`} className="absolute inset-0 z-10 outline-none">
        <span className="sr-only">Open {collection.name}</span>
      </Link>
      <Folder className={cn("size-4 shrink-0", textColor)} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{collection.name}</span>
      {collection.mainTypeName && <TypeBadge typeName={collection.mainTypeName} />}
      <span className="hidden w-16 shrink-0 text-right text-muted-foreground sm:block">
        {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
      </span>
      <FavoriteDate date={collection.updatedAt} />
    </li>
  );
}
