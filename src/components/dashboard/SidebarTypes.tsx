import { Suspense } from "react";

import { CollapsibleSidebarGroup } from "@/components/dashboard/CollapsibleSidebarGroup";
import { ProBadge } from "@/components/dashboard/ProBadge";
import { SidebarListSkeleton } from "@/components/dashboard/SidebarListSkeleton";
import { SidebarNavLink } from "@/components/dashboard/SidebarNavLink";
import { SidebarMenu, SidebarMenuBadge, SidebarMenuItem } from "@/components/ui/sidebar";
import { getItemTypesWithCounts } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/users";
import {
  getItemTypeDisplay,
  getItemTypeHref,
  getItemTypeLabel,
  isProItemType,
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
            <SidebarNavLink href={getItemTypeHref(type.name)} tooltip={label}>
              <Icon className={textColor} />
              <span>{label}</span>
              {isProItemType(type.name) && (
                <ProBadge className="group-data-[collapsible=icon]:hidden" />
              )}
            </SidebarNavLink>
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
