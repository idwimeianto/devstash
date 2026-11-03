import { Suspense } from "react";

import { CollectionGrid, CollectionGridSkeleton } from "@/components/collections/CollectionGrid";
import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllCollections } from "@/lib/db/collections";
import { getCurrentUserId } from "@/lib/db/users";

const PAGE_CLASSES = "mx-auto flex w-full max-w-6xl flex-col gap-10";

async function Collections() {
  const userId = await getCurrentUserId();
  const collections = await getAllCollections(userId);

  return (
    <>
      <header className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Collections</h1>
          <p className="mt-1 text-muted-foreground">
            {collections.length} {collections.length === 1 ? "collection" : "collections"}
          </p>
        </div>
        <div className="ml-auto">
          <NewCollectionDialog />
        </div>
      </header>

      <CollectionGrid collections={collections} />
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

export default function CollectionsPage() {
  return (
    <div className={PAGE_CLASSES}>
      {/* Collections are per user, so they stream in at request time. */}
      <Suspense fallback={<CollectionsSkeleton />}>
        <Collections />
      </Suspense>
    </div>
  );
}
