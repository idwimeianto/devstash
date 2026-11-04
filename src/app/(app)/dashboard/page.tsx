import { Clock } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { CollectionGridSkeleton } from "@/components/collections/CollectionGrid";
import { PinnedItems } from "@/components/dashboard/PinnedItems";
import { RecentCollections } from "@/components/dashboard/RecentCollections";
import {
  RecentItems,
  RecentItemsSkeleton,
} from "@/components/dashboard/RecentItems";
import {
  StatsCards,
  StatsCardsSkeleton,
} from "@/components/dashboard/StatsCards";

export default function DashboardPage() {
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
            className="-mr-2 inline-flex min-h-8 items-center rounded-md px-2 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all
          </Link>
        </div>
        <Suspense fallback={<CollectionGridSkeleton />}>
          <RecentCollections />
        </Suspense>
      </section>

      {/* No fallback: the section only exists when there are pinned items. */}
      <Suspense>
        <PinnedItems />
      </Suspense>

      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4" />
          Recent Items
        </h2>
        <Suspense fallback={<RecentItemsSkeleton />}>
          <RecentItems />
        </Suspense>
      </section>
    </div>
  );
}
