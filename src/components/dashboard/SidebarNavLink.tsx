"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { isNavLinkActive } from "@/lib/sidebar-nav";

interface SidebarNavLinkProps {
  href: string;
  tooltip: string;
  className?: string;
  children: ReactNode;
}

function NavLinkButton({
  href,
  tooltip,
  className,
  children,
  active,
}: SidebarNavLinkProps & { active: boolean }) {
  return (
    <SidebarMenuButton
      isActive={active}
      tooltip={tooltip}
      className={className}
      render={<Link href={href} aria-current={active ? "page" : undefined} />}
    >
      {children}
    </SidebarMenuButton>
  );
}

function CurrentAwareNavLink(props: SidebarNavLinkProps) {
  return <NavLinkButton {...props} active={isNavLinkActive(usePathname(), props.href)} />;
}

// A client component because the sidebar lives in a layout, which doesn't re-render on navigation.
// The URL is request-time data on dynamic routes, so the link prerenders as not current.
export function SidebarNavLink(props: SidebarNavLinkProps) {
  return (
    <Suspense fallback={<NavLinkButton {...props} active={false} />}>
      <CurrentAwareNavLink {...props} />
    </Suspense>
  );
}
