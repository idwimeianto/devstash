"use client";

import { Search } from "lucide-react";

import { useCommandPalette } from "@/components/search/CommandPaletteProvider";
import { Kbd } from "@/components/ui/kbd";

// Looks like the old search input but opens the command palette.
export function SearchTrigger() {
  const { setOpen } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Search items and collections"
      aria-keyshortcuts="Meta+K Control+K"
      className="flex h-8 w-full max-w-md min-w-0 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground transition-colors outline-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
    >
      <Search className="size-4 shrink-0" />
      <span className="flex-1 truncate text-left">Search items and collections...</span>
      <Kbd>⌘K</Kbd>
    </button>
  );
}
