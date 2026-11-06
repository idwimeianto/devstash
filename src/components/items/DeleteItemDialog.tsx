"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { deleteItem } from "@/actions/items";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteItemDialogProps {
  itemId: string;
  itemTitle: string;
  onDeleted: () => void;
}

export function DeleteItemDialog({ itemId, itemTitle, onDeleted }: DeleteItemDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={setOpen}
      title="Delete this item?"
      successMessage="Item deleted"
      action={() => deleteItem(itemId)}
      onDeleted={onDeleted}
      trigger={
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
      }
    >
      &ldquo;{itemTitle}&rdquo; will be permanently deleted and removed from its collections. This
      can&apos;t be undone.
    </ConfirmDeleteDialog>
  );
}
