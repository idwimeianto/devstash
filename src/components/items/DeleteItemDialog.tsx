"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteItem } from "@/actions/items";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { NETWORK_ERROR } from "@/lib/messages";
import type { DeleteItemResult } from "@/types/items";

interface DeleteItemDialogProps {
  itemId: string;
  itemTitle: string;
  onDeleted: () => void;
}

export function DeleteItemDialog({ itemId, itemTitle, onDeleted }: DeleteItemDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      let result: DeleteItemResult;
      try {
        result = await deleteItem(itemId);
      } catch {
        toast.error(NETWORK_ERROR);
        return;
      }

      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Item deleted");
      setOpen(false);
      onDeleted();
      // Removes the card behind the drawer and updates the counts.
      router.refresh();
    });
  }

  return (
    // Stays open while deleting, so Escape or a backdrop click can't hide a pending delete.
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete item"
            className="text-destructive hover:text-destructive"
          />
        }
      >
        <Trash2 />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this item?</AlertDialogTitle>
          <AlertDialogDescription className="break-words">
            &ldquo;{itemTitle}&rdquo; will be permanently deleted and removed from its
            collections. This can&apos;t be undone.
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
