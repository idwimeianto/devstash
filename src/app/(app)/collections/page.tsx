import { Suspense } from "react";

import { CollectionGrid, CollectionGridSkeleton } from "@/components/collections/CollectionGrid";
import { PaginationBar } from "@/components/pagination/PaginationBar";
import { Skeleton } from "@/components/ui/skeleton";
import { getCollectionsPage } from "@/lib/db/collections";
import { getCurrentUserId } from "@/lib/db/users";
import { parsePage } from "@/lib/pagination";

const PAGE_CLASSES = "flex flex-col gap-10";

async function Collections({ searchParams }: Pick<PageProps<"/collections">, "searchParams">) {
  const query = await searchParams;
  const userId = await getCurrentUserId();
  const collections = await getCollectionsPage(userId, parsePage(query.page));

  return (
    <>
      <header>
        <h1 className="text-3xl font-semibold">Collections</h1>
        <p className="mt-1 text-muted-foreground">
          {collections.total} {collections.total === 1 ? "collection" : "collections"}
        </p>
      </header>

      <CollectionGrid collections={collections.rows} />
      <PaginationBar
        page={collections.page}
        pageCount={collections.pageCount}
        pathname="/collections"
        searchParams={query}
        label="Collection pages"
      />
    </>
  );
}

function CollectionsSkeleton() {
  return (
    <>
      <div className="grid gap-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-28" />
      </div>
      <CollectionGridSkeleton />
    </>
  );
}

export default function CollectionsPage({ searchParams }: PageProps<"/collections">) {
  return (
    <div className={PAGE_CLASSES}>
      {/* Collections are per user, so they stream in at request time. */}
      <Suspense fallback={<CollectionsSkeleton />}>
        <Collections searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
