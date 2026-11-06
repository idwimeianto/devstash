import { LayoutDashboard } from "lucide-react";

import { SidebarCollections } from "@/components/dashboard/SidebarCollections";
import { SidebarNavLink } from "@/components/dashboard/SidebarNavLink";
import { SidebarTypes } from "@/components/dashboard/SidebarTypes";
import { SidebarUser } from "@/components/dashboard/SidebarUser";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
    >
      {/* Collapsed to icons, the toggle stacks above the Dashboard link. */}
      <SidebarHeader className="flex-row items-center group-data-[collapsible=icon]:flex-col-reverse">
        <SidebarMenu className="min-w-0 flex-1">
          <SidebarMenuItem>
            <SidebarNavLink href="/dashboard" tooltip="Dashboard">
              <LayoutDashboard />
              <span>Dashboard</span>
            </SidebarNavLink>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarTrigger className="size-8 shrink-0" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarTypes />
        <SidebarSeparator className="mx-0" />
        <SidebarCollections />
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
