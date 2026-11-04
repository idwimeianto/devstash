"use client";

import { Menu } from "lucide-react";
import Link from "next/link";

import { homeButton } from "@/components/home/HomeShared";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HOME_NAV_LINKS } from "@/lib/home-content";

// The nav links are hidden below `sm`, so phones reach them (and Sign In) through this menu.
export function HomeMobileMenu({ signedIn }: { signedIn: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open menu"
        className={homeButton("ghost", "default", "size-9 px-0 sm:hidden")}
      >
        <Menu />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {HOME_NAV_LINKS.map(({ label, href }) => (
          <DropdownMenuItem key={href} render={<a href={href} />} className="min-h-10">
            {label}
          </DropdownMenuItem>
        ))}
        {/* The nav's own Sign In button is hidden below 440px. */}
        {!signedIn && (
          <>
            <DropdownMenuSeparator className="min-[440px]:hidden" />
            <DropdownMenuItem render={<Link href="/sign-in" />} className="min-h-10 min-[440px]:hidden">
              Sign In
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
