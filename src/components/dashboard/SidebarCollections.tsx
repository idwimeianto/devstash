import { ArrowRight, ChevronDown, Folder, Star } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { CollapsibleSidebarGroup } from "@/components/dashboard/CollapsibleSidebarGroup";
import { SidebarListSkeleton } from "@/components/dashboard/SidebarListSkeleton";
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
import { getSidebarCollections } from "@/lib/db/collections";
import { getCurrentUserId } from "@/lib/db/users";
import { getItemTypeDisplay } from "@/lib/item-type-display";
import { cn } from "@/lib/utils";
import type { SidebarCollection } from "@/types/collections";

const SKELETON_COUNT = 5;

interface CollectionListProps {
  heading: string;
  collections: SidebarCollection[];
  showFavorite?: boolean;
}

interface TypeDotProps {
  typeName: string | null;
}

// Colored circle for the collection's most-used item type.
function TypeDot({ typeName }: TypeDotProps) {
  const { bgColor } = getItemTypeDisplay(typeName ?? "");
  return (
    <span className="flex size-4 shrink-0 items-center justify-center">
      <span className={cn("size-2.5 rounded-full", bgColor)} />
    </span>
  );
}

function CollectionList({
  heading,
  collections,
  showFavorite = false,
}: CollectionListProps) {
  if (collections.length === 0) return null;

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
                {showFavorite ? (
                  <Folder className="text-muted-foreground" />
                ) : (
                  <TypeDot typeName={collection.mainTypeName} />
                )}
                <span>{collection.name}</span>
              </SidebarMenuButton>
              <SidebarMenuBadge>
                {showFavorite ? (
                  <Star className="size-4 fill-yellow-400 text-yellow-400" />
                ) : (
                  collection.itemCount
                )}
              </SidebarMenuBadge>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

async function SidebarCollectionLists() {
  const userId = await getCurrentUserId();
  const { favorites, recent } = await getSidebarCollections(userId);

  return (
    <>
      <CollectionList heading="Favorites" collections={favorites} showFavorite />
      <CollectionList heading="Recent" collections={recent} />
    </>
  );
}

export function SidebarCollections() {
  return (
    <CollapsibleSidebarGroup label="Collections">
      <Suspense fallback={<SidebarListSkeleton count={SKELETON_COUNT} />}>
        <SidebarCollectionLists />
      </Suspense>
      <SidebarMenu className="mt-2">
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="View all collections"
            className="text-muted-foreground"
            render={<Link href="/collections" />}
          >
            <ArrowRight />
            <span>View all collections</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </CollapsibleSidebarGroup>
  );
}
