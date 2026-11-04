import { connection } from "next/server";
import { Suspense } from "react";

import { auth } from "@/auth";
import { SidebarUserMenu } from "@/components/dashboard/SidebarUserMenu";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

async function SidebarUserContent() {
  // NextAuth calls crypto.getRandomValues(), which can't run during prerendering.
  await connection();
  const session = await auth();
  if (!session?.user) return null;

  const { name, email, image, isPro } = session.user;
  return (
    <SidebarUserMenu
      user={{ name: name ?? null, email: email ?? null, image: image ?? null, isPro }}
    />
  );
}

function SidebarUserSkeleton() {
  return (
    <div className="flex h-12 items-center gap-2 p-2">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="grid flex-1 gap-1.5 group-data-[collapsible=icon]:hidden">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

// Reading the session is request-time data, so it streams in behind a boundary.
export function SidebarUser() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Suspense fallback={<SidebarUserSkeleton />}>
          <SidebarUserContent />
        </Suspense>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
