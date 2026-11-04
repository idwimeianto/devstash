import { Layers, Star } from "lucide-react";
import Link from "next/link";

import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { NewItemButton } from "@/components/items/NewItemButton";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { buttonVariants } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center border-b bg-background">
      <div className="flex h-full shrink-0 items-center px-4 md:w-(--sidebar-width) md:border-r">
        <Link
          href="/dashboard"
          aria-label="DevStash dashboard"
          className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 text-white">
            <Layers className="size-4" />
          </div>
          <span className="hidden text-lg font-semibold sm:inline">DevStash</span>
        </Link>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2 px-2 md:gap-4 md:px-4">
        <SidebarTrigger className="md:hidden" />
        <SearchTrigger />
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/favorites"
            aria-label="Favorites"
            title="Favorites"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <Star />
          </Link>
          <NewCollectionDialog />
          <NewItemButton iconOnlyOnMobile />
        </div>
      </div>
    </header>
  );
}
