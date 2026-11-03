import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ItemGrid, ItemGridSkeleton } from "@/components/items/ItemGrid";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getItemTypeBySlug, getItemsByType } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/users";
import { isCreatableItemType } from "@/lib/item-fields";
import { getItemTypeDisplay, getItemTypeLabel } from "@/lib/item-type-display";
import { cn } from "@/lib/utils";

const PAGE_CLASSES = "mx-auto flex w-full max-w-6xl flex-col gap-10";

async function ItemsByType({ params }: Pick<PageProps<"/items/[type]">, "params">) {
  const { type: slug } = await params;
  const userId = await getCurrentUserId();
  const type = await getItemTypeBySlug(userId, slug);
  if (!type) notFound();

  const items = await getItemsByType(userId, type.id);
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
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        {/* Custom types can't be created from the dialog yet. */}
        {isCreatableItemType(type.name) && (
          <div className="ml-auto">
            <NewItemDialog
              defaultType={type.name}
              label={`New ${type.name.charAt(0).toUpperCase()}${type.name.slice(1)}`}
            />
          </div>
        )}
      </header>

      <ItemGrid
        items={items}
        emptyMessage={`No ${label.toLowerCase()} yet. Add one to start building your stash.`}
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

export default function ItemsByTypePage({ params }: PageProps<"/items/[type]">) {
  return (
    <div className={PAGE_CLASSES}>
      {/* The type and its items are per user, so they stream in at request time. */}
      <Suspense fallback={<ItemsByTypeSkeleton />}>
        <ItemsByType params={params} />
      </Suspense>
    </div>
  );
}
