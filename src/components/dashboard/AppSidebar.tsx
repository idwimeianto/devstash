import { SidebarCollections } from "@/components/dashboard/SidebarCollections";
import { SidebarTypes } from "@/components/dashboard/SidebarTypes";
import { SidebarUser } from "@/components/dashboard/SidebarUser";
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
      <SidebarHeader className="flex-row justify-end">
        <SidebarTrigger />
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
