"use client";

import { useTransition } from "react";

import { updateCollection } from "@/actions/collections";
import { CollectionForm } from "@/components/collections/CollectionForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CollectionRef } from "@/types/collections";

interface EditCollectionDialogProps {
  collection: Pick<CollectionRef, "id" | "name" | "description">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCollectionDialog({ collection, open, onOpenChange }: EditCollectionDialogProps) {
  const [pending, startTransition] = useTransition();

  return (
    // Stays open while saving, so Escape or a backdrop click can't hide a pending save.
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit collection</DialogTitle>
          <DialogDescription>Change the collection&apos;s name and description.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form starts from the current values every time. */}
        <CollectionForm
          initialValues={collection}
          submitLabel="Save"
          successMessage="Collection updated"
          action={(input) => updateCollection(collection.id, input)}
          pending={pending}
          startTransition={startTransition}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
