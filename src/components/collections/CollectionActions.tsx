"use client";

import { Pencil, Star, Trash2 } from "lucide-react";
import { useState } from "react";

import { DeleteCollectionDialog } from "@/components/collections/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CollectionRef } from "@/types/collections";

interface CollectionActionsProps {
  collection: CollectionRef;
}

// Favorite, Edit and Delete buttons for the collection page header.
export function CollectionActions({ collection }: CollectionActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-1">
      {/* Display only until favorites are implemented. */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={collection.isFavorite ? "Unfavorite collection" : "Favorite collection"}
        aria-pressed={collection.isFavorite}
      >
        <Star className={cn(collection.isFavorite && "fill-yellow-400 text-yellow-400")} />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit collection"
        onClick={() => setEditOpen(true)}
      >
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete collection"
        className="text-destructive hover:text-destructive"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 />
      </Button>
      <EditCollectionDialog collection={collection} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteCollectionDialog
        collection={collection}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        redirectTo="/collections"
      />
    </div>
  );
}
