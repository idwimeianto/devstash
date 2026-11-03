"use client";

import { Folder } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { useCommandPalette } from "@/components/search/CommandPaletteProvider";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { getItemTypeDisplay } from "@/lib/item-type-display";
import { searchFilter } from "@/lib/search-filter";
import type { SearchData } from "@/types/search";

interface CommandPaletteProps {
  // null while the layout is still loading the search data.
  data: SearchData | null;
}

export function CommandPalette({ data }: CommandPaletteProps) {
  const { open, setOpen } = useCommandPalette();
  const { openItem } = useItemDrawer();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);

  // cmdk keeps its selection while closed, so each opening remounts it (keyed by session)
  // with an empty search.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSession((current) => current + 1);
      setSearch("");
    }
  }

  // cmdk scrolls the selected item into view before re-sorting the results, which can leave
  // the best match above the visible area; it is always first, so start at the top instead.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => listRef.current?.scrollTo({ top: 0 }));
    return () => cancelAnimationFrame(frame);
  }, [open, search]);

  function select(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search your items and collections"
      className="sm:max-w-xl"
    >
      <Command key={session} filter={searchFilter} loop>
        <CommandInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search items and collections..."
          aria-label="Search items and collections"
        />
        <CommandList ref={listRef}>
          {data ? (
            <>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Items">
                {data.items.map((item) => {
                  const { icon: Icon, textColor } = getItemTypeDisplay(item.typeName);
                  return (
                    <CommandItem
                      key={item.id}
                      value={`item:${item.id}`}
                      keywords={[item.title, item.preview ?? "", item.typeName]}
                      onSelect={() => select(() => openItem(item.id))}
                    >
                      <Icon className={textColor} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{item.title}</p>
                        {item.preview && (
                          <p className="truncate text-xs text-muted-foreground">{item.preview}</p>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandGroup heading="Collections">
                {data.collections.map((collection) => (
                  <CommandItem
                    key={collection.id}
                    value={`collection:${collection.id}`}
                    keywords={[collection.name]}
                    onSelect={() => select(() => router.push(`/collections/${collection.id}`))}
                  >
                    <Folder className="text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{collection.name}</span>
                    <CommandShortcut className="tracking-normal">
                      {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
