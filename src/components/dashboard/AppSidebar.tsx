import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

import { SidebarCollections } from "@/components/dashboard/SidebarCollections";
import { SidebarTypes } from "@/components/dashboard/SidebarTypes";
import { SidebarUser } from "@/components/dashboard/SidebarUser";
import { buttonVariants } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
    >
      <SidebarHeader className="flex-row items-center">
        {/* Hidden when collapsed to icons, where only the toggle fits. */}
        <Link
          href="/dashboard"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "group-data-[collapsible=icon]:hidden",
          })}
        >
          <LayoutDashboard />
          Dashboard
        </Link>
        <SidebarTrigger className="ml-auto" />
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
