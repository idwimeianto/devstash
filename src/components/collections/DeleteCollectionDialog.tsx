"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteCollection } from "@/actions/collections";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { NETWORK_ERROR } from "@/lib/messages";
import type { CollectionRef, DeleteCollectionResult } from "@/types/collections";

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
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      let result: DeleteCollectionResult;
      try {
        result = await deleteCollection(collection.id);
      } catch {
        toast.error(NETWORK_ERROR);
        return;
      }

      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Collection deleted");
      onOpenChange(false);
      if (redirectTo) router.push(redirectTo);
      // Removes the card and updates the counts and the sidebar, which the layout keeps.
      router.refresh();
    });
  }

  return (
    // Stays open while deleting, so Escape or a backdrop click can't hide a pending delete.
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this collection?</AlertDialogTitle>
          <AlertDialogDescription className="break-words">
            &ldquo;{collection.name}&rdquo; will be permanently deleted. Its items are kept and
            stay in your other collections. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
