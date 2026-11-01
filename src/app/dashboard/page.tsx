import { Clock, Pin } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ItemCard } from "@/components/dashboard/ItemCard";
import {
  RecentCollections,
  RecentCollectionsSkeleton,
} from "@/components/dashboard/RecentCollections";
import {
  StatsCards,
  StatsCardsSkeleton,
} from "@/components/dashboard/StatsCards";
import { getPinnedItems, getRecentItems } from "@/lib/dashboard";

export default function DashboardPage() {
  const pinnedItems = getPinnedItems();
  const recentItems = getRecentItems();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <header>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Your developer knowledge hub</p>
      </header>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Collections</h2>
          <Link
            href="/collections"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <Suspense fallback={<RecentCollectionsSkeleton />}>
          <RecentCollections />
        </Suspense>
      </section>

      {pinnedItems.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-muted-foreground">
            <Pin className="size-4" />
            Pinned
          </h2>
          <div className="flex flex-col gap-3">
            {pinnedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4" />
          Recent Items
        </h2>
        <div className="flex flex-col gap-3">
          {recentItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
