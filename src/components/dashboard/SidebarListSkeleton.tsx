import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

// Fixed widths: shadcn's SidebarMenuSkeleton uses Math.random(), which breaks prerendering.
const ROW_WIDTHS = ["w-3/4", "w-2/3", "w-4/5", "w-1/2", "w-3/5"];

interface SidebarListSkeletonProps {
  count: number;
}

export function SidebarListSkeleton({ count }: SidebarListSkeletonProps) {
  return (
    <SidebarMenu>
      {Array.from({ length: count }, (_, i) => (
        <SidebarMenuItem key={i} className="flex h-8 items-center gap-2 px-2">
          <Skeleton className="size-4 rounded-md" />
          <Skeleton
            className={`h-4 group-data-[collapsible=icon]:hidden ${ROW_WIDTHS[i % ROW_WIDTHS.length]}`}
          />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
