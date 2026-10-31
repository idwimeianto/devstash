import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

interface CollapsibleSidebarGroupProps {
  label: string;
  children: React.ReactNode;
}

export function CollapsibleSidebarGroup({
  label,
  children,
}: CollapsibleSidebarGroupProps) {
  return (
    <Collapsible defaultOpen>
      <SidebarGroup>
        <SidebarGroupLabel
          render={<CollapsibleTrigger />}
          className="group/label cursor-pointer gap-1 tracking-wide uppercase hover:text-sidebar-foreground"
        >
          {label}
          <ChevronDown className="-rotate-90 transition-transform group-data-panel-open/label:rotate-0" />
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
