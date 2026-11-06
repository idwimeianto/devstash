import { Star } from "lucide-react";
import Link from "next/link";

import { UpgradeButton } from "@/components/billing/UpgradeButton";
import { LogoMark } from "@/components/brand/LogoMark";
import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { NewItemButton } from "@/components/items/NewItemButton";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { buttonVariants } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center border-b bg-background">
      {/* Follows the sidebar's width, so the divider stays in line when it collapses to icons. */}
      <div className="flex h-full shrink-0 items-center px-4 transition-[width,padding] duration-200 ease-linear md:w-(--sidebar-width) md:border-r md:group-has-[[data-slot=sidebar][data-state=collapsed]]/sidebar-wrapper:w-(--sidebar-width-icon) md:group-has-[[data-slot=sidebar][data-state=collapsed]]/sidebar-wrapper:px-2">
        <Link
          href="/dashboard"
          aria-label="DevStash dashboard"
          className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogoMark />
          <span className="hidden text-lg font-semibold sm:inline md:group-has-[[data-slot=sidebar][data-state=collapsed]]/sidebar-wrapper:hidden">
            DevStash
          </span>
        </Link>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2 px-2 md:gap-4 md:px-4">
        <SidebarTrigger className="size-8 md:hidden" />
        <SearchTrigger />
        <div className="ml-auto flex items-center gap-2">
          <UpgradeButton />
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
