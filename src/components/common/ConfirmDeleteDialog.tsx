"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { toast } from "sonner";

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

type DeleteResult = { success: true } | { success: false; error: string };

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  // The description text.
  children: ReactNode;
  successMessage: string;
  action: () => Promise<DeleteResult>;
  // Runs before the refresh, e.g. to close a drawer or leave the deleted record's page.
  onDeleted?: () => void;
  // An AlertDialogTrigger, when the dialog owns the button that opens it.
  trigger?: ReactNode;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  children,
  successMessage,
  action,
  onDeleted,
  trigger,
}: ConfirmDeleteDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      let result: DeleteResult;
      try {
        result = await action();
      } catch {
        toast.error(NETWORK_ERROR);
        return;
      }

      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      onOpenChange(false);
      onDeleted?.();
      // Removes the card and updates the counts and the sidebar, which the layout keeps.
      router.refresh();
    });
  }

  return (
    // Stays open while deleting, so Escape or a backdrop click can't hide a pending delete.
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      {trigger}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="break-words">{children}</AlertDialogDescription>
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
