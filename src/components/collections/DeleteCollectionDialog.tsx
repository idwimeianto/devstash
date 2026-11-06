"use client";

import { useRouter } from "next/navigation";

import { deleteCollection } from "@/actions/collections";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import type { CollectionRef } from "@/types/collections";

interface DeleteCollectionDialogProps {
  collection: Pick<CollectionRef, "id" | "name">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Where to go after deleting, e.g. away from the deleted collection's page.
  redirectTo?: string;
}

export function DeleteCollectionDialog({
  collection,
  open,
  onOpenChange,
  redirectTo,
}: DeleteCollectionDialogProps) {
  const router = useRouter();

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete this collection?"
      successMessage="Collection deleted"
      action={() => deleteCollection(collection.id)}
      onDeleted={() => {
        if (redirectTo) router.push(redirectTo);
      }}
    >
      &ldquo;{collection.name}&rdquo; will be permanently deleted. Its items are kept and stay in
      your other collections. This can&apos;t be undone.
    </ConfirmDeleteDialog>
  );
}
