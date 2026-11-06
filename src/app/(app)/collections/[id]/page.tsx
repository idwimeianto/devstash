import { ArrowLeft, FolderOpen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CollectionActions } from "@/components/collections/CollectionActions";
import { EmptyState } from "@/components/common/EmptyState";
import { ItemGrid, ItemGridSkeleton, type ItemGridLayout } from "@/components/items/ItemGrid";
import { PaginationBar } from "@/components/pagination/PaginationBar";
import { Skeleton } from "@/components/ui/skeleton";
import { getCollection } from "@/lib/db/collections";
import { getItemsByCollection } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/users";
import { parsePage } from "@/lib/pagination";
import type { CollectionSection } from "@/types/items";

const PAGE_CLASSES = "flex flex-col gap-10";

// Files and images get their own list and gallery, apart from the regular cards,
// and each section has its own page param.
const SECTIONS: {
  section: CollectionSection;
  title: string;
  layout: ItemGridLayout;
  param: string;
}[] = [
  { section: "items", title: "Items", layout: "cards", param: "page" },
  { section: "files", title: "Files", layout: "list", param: "filesPage" },
  { section: "images", title: "Images", layout: "gallery", param: "imagesPage" },
];

async function CollectionItems({ params, searchParams }: PageProps<"/collections/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const userId = await getCurrentUserId();
  const [collection, ...pages] = await Promise.all([
    getCollection(userId, id),
    ...SECTIONS.map(({ section, param }) =>
      getItemsByCollection(userId, id, section, parsePage(query[param]))
    ),
  ]);
  if (!collection) notFound();

  const sections = SECTIONS.map((section, index) => ({ ...section, items: pages[index] }));
  const total = pages.reduce((sum, page) => sum + page.total, 0);
  const pathname = `/collections/${encodeURIComponent(id)}`;

  return (
    <>
      <header className="flex flex-col gap-3">
        <Link
          href="/collections"
          className="-ml-2 flex min-h-8 items-center gap-1.5 self-start rounded-md px-2 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" />
          All collections
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted">
            <FolderOpen className="size-6 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-3xl font-semibold">{collection.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {total} {total === 1 ? "item" : "items"}
            </p>
          </div>
          <CollectionActions collection={collection} />
        </div>
        {collection.description && (
          <p className="text-muted-foreground">{collection.description}</p>
        )}
      </header>

      {total === 0 ? (
        <EmptyState
          icon={FolderOpen}
          message="No items in this collection yet. Add some from an item's edit form."
        />
      ) : (
        sections
          .filter(({ items }) => items.total > 0)
          .map(({ section, title, layout, param, items }) => (
            // scroll-mt keeps the heading clear of the sticky top bar when a page link jumps here.
            <section
              key={section}
              id={section}
              className="flex scroll-mt-(--header-height) flex-col gap-4"
            >
              <h2 className="text-xl font-semibold">{title}</h2>
              <ItemGrid items={items.rows} layout={layout} />
              <PaginationBar
                page={items.page}
                pageCount={items.pageCount}
                pathname={pathname}
                searchParams={query}
                param={param}
                hash={section}
                label={`${title} pages`}
              />
            </section>
          ))
      )}
    </>
  );
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

export default function CollectionPage({ params, searchParams }: PageProps<"/collections/[id]">) {
  return (
    <div className={PAGE_CLASSES}>
      {/* The collection and its items are per user, so they stream in at request time. */}
      <Suspense fallback={<CollectionItemsSkeleton />}>
        <CollectionItems params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
