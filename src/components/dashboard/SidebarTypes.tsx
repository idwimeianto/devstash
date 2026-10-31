import Link from "next/link";

import { CollapsibleSidebarGroup } from "@/components/dashboard/CollapsibleSidebarGroup";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  getItemTypeDisplay,
  getItemTypeHref,
  getItemTypeLabel,
} from "@/lib/item-type-display";
import { ITEMS, ITEM_TYPES } from "@/lib/mock-data";

export function SidebarTypes() {
  return (
    <CollapsibleSidebarGroup label="Types">
      <SidebarMenu>
        {ITEM_TYPES.map((type) => {
          const { icon: Icon, textColor } = getItemTypeDisplay(type.name);
          const label = getItemTypeLabel(type.name);
          const count = ITEMS.filter((item) => item.typeId === type.id).length;

          return (
            <SidebarMenuItem key={type.id}>
              <SidebarMenuButton
                tooltip={label}
                render={<Link href={getItemTypeHref(type.name)} />}
              >
                <Icon className={textColor} />
                <span>{label}</span>
              </SidebarMenuButton>
              <SidebarMenuBadge>{count}</SidebarMenuBadge>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </CollapsibleSidebarGroup>
  );
}
