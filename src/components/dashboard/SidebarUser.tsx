import { Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CURRENT_USER } from "@/lib/mock-data";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SidebarUser() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" tooltip={CURRENT_USER.name}>
          <Avatar className="size-8">
            {CURRENT_USER.image && (
              <AvatarImage src={CURRENT_USER.image} alt={CURRENT_USER.name} />
            )}
            <AvatarFallback>{getInitials(CURRENT_USER.name)}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate font-medium">{CURRENT_USER.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {CURRENT_USER.email}
            </span>
          </div>
          <Settings className="ml-auto text-muted-foreground" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
