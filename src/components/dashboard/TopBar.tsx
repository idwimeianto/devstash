import { FolderPlus, Layers, Search } from "lucide-react";

import { NewItemDialog } from "@/components/items/NewItemDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
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
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search items..."
            aria-label="Search items"
            className="pr-12 pl-8"
          />
          <Kbd className="absolute top-1/2 right-2 -translate-y-1/2">⌘K</Kbd>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" aria-label="New Collection">
            <FolderPlus />
            <span className="hidden sm:inline">New Collection</span>
          </Button>
          <NewItemDialog iconOnlyOnMobile />
        </div>
      </div>
    </header>
  );
}
