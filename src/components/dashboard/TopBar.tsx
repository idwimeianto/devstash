import { Layers } from "lucide-react";

import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center border-b bg-background">
      <div className="flex h-full shrink-0 items-center gap-2 px-4 md:w-(--sidebar-width) md:border-r">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 text-white">
          <Layers className="size-4" />
        </div>
        <span className="hidden text-lg font-semibold sm:inline">DevStash</span>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2 px-2 md:gap-4 md:px-4">
        <SidebarTrigger className="md:hidden" />
        <SearchTrigger />
        <div className="ml-auto flex items-center gap-2">
          <NewCollectionDialog />
          <NewItemDialog iconOnlyOnMobile />
        </div>
      </div>
    </header>
  );
}
