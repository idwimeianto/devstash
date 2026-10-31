import { ChevronDown, Folder, Star } from "lucide-react";
import Link from "next/link";

import { CollapsibleSidebarGroup } from "@/components/dashboard/CollapsibleSidebarGroup";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { COLLECTIONS, ITEMS, type Collection } from "@/lib/mock-data";

const RECENT_COLLECTIONS_LIMIT = 5;

interface CollectionListProps {
  heading: string;
  collections: Collection[];
  showFavorite?: boolean;
}

function CollectionList({
  heading,
  collections,
  showFavorite = false,
}: CollectionListProps) {
  return (
    <Collapsible defaultOpen className="mt-2 first:mt-0">
      <CollapsibleTrigger className="group/heading flex w-full cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground outline-hidden hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:hidden">
        {heading}
        <ChevronDown className="size-3.5 -rotate-90 transition-transform group-data-panel-open/heading:rotate-0" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenu>
          {collections.map((collection) => (
            <SidebarMenuItem key={collection.id}>
              <SidebarMenuButton
                tooltip={collection.name}
                render={<Link href={`/collections/${collection.id}`} />}
              >
                <Folder className="text-muted-foreground" />
                <span>{collection.name}</span>
              </SidebarMenuButton>
              <SidebarMenuBadge>
                {showFavorite ? (
                  <Star className="size-4 fill-yellow-400 text-yellow-400" />
                ) : (
                  ITEMS.filter((item) =>
                    item.collectionIds.includes(collection.id)
                  ).length
                )}
              </SidebarMenuBadge>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SidebarCollections() {
  const favorites = COLLECTIONS.filter((collection) => collection.isFavorite);
  const recent = COLLECTIONS.filter((collection) => !collection.isFavorite)
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, RECENT_COLLECTIONS_LIMIT);

  return (
    <CollapsibleSidebarGroup label="Collections">
      <CollectionList heading="Favorites" collections={favorites} showFavorite />
      <CollectionList heading="Recent" collections={recent} />
    </CollapsibleSidebarGroup>
  );
}
