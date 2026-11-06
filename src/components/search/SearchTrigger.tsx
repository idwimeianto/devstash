"use client";

import { Search } from "lucide-react";

import { useCommandPalette } from "@/components/search/CommandPaletteProvider";
import { Kbd } from "@/components/ui/kbd";

// Looks like the old search input but opens the command palette; an icon-only button below `sm`.
export function SearchTrigger() {
  const { setOpen } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Search items and collections"
      aria-keyshortcuts="Meta+K Control+K"
      className="flex h-8 max-w-md min-w-0 shrink-0 cursor-text items-center justify-center gap-2 rounded-lg border border-input bg-transparent text-sm text-muted-foreground transition-colors outline-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 max-sm:w-8 sm:w-full sm:shrink sm:justify-start sm:px-2.5 dark:bg-input/30"
    >
      <Search className="size-4 shrink-0" />
      <span className="flex-1 truncate text-left max-sm:hidden">Search items and collections...</span>
      <Kbd className="max-sm:hidden">⌘K</Kbd>
    </button>
  );
}
