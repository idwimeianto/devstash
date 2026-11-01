import Link from "next/link";
import { Suspense } from "react";

import { CollapsibleSidebarGroup } from "@/components/dashboard/CollapsibleSidebarGroup";
import { SidebarListSkeleton } from "@/components/dashboard/SidebarListSkeleton";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getItemTypesWithCounts } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/users";
import {
  getItemTypeDisplay,
  getItemTypeHref,
  getItemTypeLabel,
} from "@/lib/item-type-display";

const SKELETON_COUNT = 7;

async function SidebarTypeList() {
  const userId = await getCurrentUserId();
  const types = await getItemTypesWithCounts(userId);

  return (
    <SidebarMenu>
      {types.map((type) => {
        const { icon: Icon, textColor } = getItemTypeDisplay(type.name);
        const label = getItemTypeLabel(type.name);

        return (
          <SidebarMenuItem key={type.id}>
            <SidebarMenuButton
              tooltip={label}
              render={<Link href={getItemTypeHref(type.name)} />}
            >
              <Icon className={textColor} />
              <span>{label}</span>
            </SidebarMenuButton>
            <SidebarMenuBadge>{type.itemCount}</SidebarMenuBadge>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function SidebarTypes() {
  return (
    <CollapsibleSidebarGroup label="Types">
      <Suspense fallback={<SidebarListSkeleton count={SKELETON_COUNT} />}>
        <SidebarTypeList />
      </Suspense>
    </CollapsibleSidebarGroup>
  );
}
