import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { ItemGrid, ItemGridSkeleton, type ItemGridLayout } from "@/components/items/ItemGrid";
import { NewItemButton } from "@/components/items/NewItemButton";
import { ProTypeUpsell } from "@/components/items/ProTypeUpsell";
import { PaginationBar } from "@/components/pagination/PaginationBar";
import { Skeleton } from "@/components/ui/skeleton";
import { getItemTypeBySlug, getItemsByType } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/users";
import { isUploadKind } from "@/lib/file-upload";
import { isCreatableItemType } from "@/lib/item-fields";
import { getItemTypeDisplay, getItemTypeLabel } from "@/lib/item-type-display";
import { parsePage } from "@/lib/pagination";
import { checkUploadAllowed } from "@/lib/usage-checks";
import { cn } from "@/lib/utils";

const PAGE_CLASSES = "flex flex-col gap-10";

function getLayout(typeName: string): ItemGridLayout {
  if (typeName === "image") return "gallery";
  if (typeName === "file") return "list";
  return "cards";
}

async function ItemsByType({ params, searchParams }: PageProps<"/items/[type]">) {
  const [{ type: slug }, query] = await Promise.all([params, searchParams]);
  const userId = await getCurrentUserId();
  const type = await getItemTypeBySlug(userId, slug);
  if (!type) notFound();

  // Files and images are Pro-only: free users get the upgrade page instead of the list.
  // Nothing is checked while gating is off.
  if (isUploadKind(type.name) && (await checkUploadAllowed(userId))) {
    return <ProTypeUpsell typeName={type.name} />;
  }

  const items = await getItemsByType(userId, type.id, parsePage(query.page));
  const { icon: Icon, textColor, bgTint } = getItemTypeDisplay(type.name);
  const label = getItemTypeLabel(type.name);

  return (
    <>
      <header className="flex items-center gap-4">
        <div
          className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", bgTint)}
        >
          <Icon className={cn("size-6", textColor)} />
        </div>
        <div>
          <h1 className="text-3xl font-semibold">{label}</h1>
          <p className="mt-1 text-muted-foreground">
            {items.total} {items.total === 1 ? "item" : "items"}
          </p>
        </div>
        {/* Custom types can't be created from the dialog yet. */}
        {isCreatableItemType(type.name) && (
          <div className="ml-auto">
            <NewItemButton
              defaultType={type.name}
              label={`New ${type.name.charAt(0).toUpperCase()}${type.name.slice(1)}`}
              iconOnlyOnMobile
            />
          </div>
        )}
      </header>

      <ItemGrid
        items={items.rows}
        layout={getLayout(type.name)}
        empty={
          <EmptyState
            icon={Icon}
            message={`No ${label.toLowerCase()} yet. Add one to start building your stash.`}
          />
        }
      />
      <PaginationBar
        page={items.page}
        pageCount={items.pageCount}
        pathname={`/items/${encodeURIComponent(slug)}`}
        searchParams={query}
        label={`${label} pages`}
      />
    </>
  );
}

function ItemsByTypeSkeleton() {
  return (
    <>
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-xl" />
        <div className="grid gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <ItemGridSkeleton />
    </>
  );
}

export default function ItemsByTypePage({ params, searchParams }: PageProps<"/items/[type]">) {
  return (
    <div className={PAGE_CLASSES}>
      {/* The type and its items are per user, so they stream in at request time. */}
      <Suspense fallback={<ItemsByTypeSkeleton />}>
        <ItemsByType params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
