import { FolderOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CollectionActions } from "@/components/collections/CollectionActions";
import { ItemGrid, ItemGridSkeleton, type ItemGridLayout } from "@/components/items/ItemGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { getCollection } from "@/lib/db/collections";
import { getItemsByCollection } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/users";
import type { ItemSummary } from "@/types/items";

const PAGE_CLASSES = "mx-auto flex w-full max-w-6xl flex-col gap-10";

async function CollectionItems({ params }: Pick<PageProps<"/collections/[id]">, "params">) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const [collection, items] = await Promise.all([
    getCollection(userId, id),
    getItemsByCollection(userId, id),
  ]);
  if (!collection) notFound();

  return (
    <>
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted">
            <FolderOpen className="size-6 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-3xl font-semibold">{collection.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
          <CollectionActions collection={collection} />
        </div>
        {collection.description && (
          <p className="text-muted-foreground">{collection.description}</p>
        )}
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No items in this collection yet. Add some from an item&apos;s edit form.
        </p>
      ) : (
        <CollectionSections items={items} />
      )}
    </>
  );
}

// Files and images get their own list and gallery, apart from the regular cards.
function CollectionSections({ items }: { items: ItemSummary[] }) {
  const sections: { title: string; layout: ItemGridLayout; items: ItemSummary[] }[] = [
    {
      title: "Items",
      layout: "cards",
      items: items.filter((item) => item.typeName !== "file" && item.typeName !== "image"),
    },
    { title: "Files", layout: "list", items: items.filter((item) => item.typeName === "file") },
    { title: "Images", layout: "gallery", items: items.filter((item) => item.typeName === "image") },
  ];

  return sections
    .filter((section) => section.items.length > 0)
    .map((section) => (
      <section key={section.title} className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{section.title}</h2>
        <ItemGrid items={section.items} layout={section.layout} emptyMessage="" />
      </section>
    ));
}

function CollectionItemsSkeleton() {
  return (
    <>
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-xl" />
        <div className="grid gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <ItemGridSkeleton />
    </>
  );
}

export default function CollectionPage({ params }: PageProps<"/collections/[id]">) {
  return (
    <div className={PAGE_CLASSES}>
      {/* The collection and its items are per user, so they stream in at request time. */}
      <Suspense fallback={<CollectionItemsSkeleton />}>
        <CollectionItems params={params} />
      </Suspense>
    </div>
  );
}
