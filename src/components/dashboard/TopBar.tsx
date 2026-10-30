import { FolderPlus, Layers, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center border-b">
      <div className="flex h-full shrink-0 items-center gap-2 px-4 md:w-64 md:border-r">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 text-white">
          <Layers className="size-4" />
        </div>
        <span className="text-lg font-semibold">DevStash</span>
      </div>
      <div className="flex flex-1 items-center gap-4 px-4">
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
          <Button variant="outline" className="hidden sm:inline-flex">
            <FolderPlus />
            New Collection
          </Button>
          <Button>
            <Plus />
            New Item
          </Button>
        </div>
      </div>
    </header>
  );
}
