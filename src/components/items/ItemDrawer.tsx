"use client";

import { ItemDetailView } from "@/components/items/ItemDetailView";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { ItemDetailJson } from "@/types/items";

export type ItemDrawerState =
  | { status: "loading" }
  | { status: "loaded"; item: ItemDetailJson }
  | { status: "error"; itemId: string; error: string };

interface ItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: ItemDrawerState;
  onRetry: (itemId: string) => void;
}

export function ItemDrawer({ open, onOpenChange, state, onRetry }: ItemDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        {state.status === "loading" && <ItemDrawerSkeleton />}
        {state.status === "loaded" && <ItemDetailView item={state.item} />}
        {state.status === "error" && (
          <SheetHeader className="gap-3 p-6 pr-12">
            <SheetTitle className="text-lg font-semibold">Couldn&apos;t load this item</SheetTitle>
            <p className="text-muted-foreground">{state.error}</p>
            <Button
              variant="outline"
              className="self-start"
              onClick={() => onRetry(state.itemId)}
            >
              Try again
            </Button>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ItemDrawerSkeleton() {
  return (
    <>
      <SheetHeader className="gap-5 border-b p-6 pr-12">
        <SheetTitle className="sr-only">Loading item</SheetTitle>
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-xl" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <Skeleton className="h-7 w-full" />
      </SheetHeader>
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-16 w-1/2" />
      </div>
    </>
  );
}
