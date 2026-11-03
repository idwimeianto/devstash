"use client";

import { FolderPlus } from "lucide-react";
import { useState, useTransition } from "react";

import { createCollection } from "@/actions/collections";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewCollectionDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    // Stays open while saving, so Escape or a backdrop click can't hide a pending create.
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={<Button variant="outline" aria-label="New Collection" />}>
        <FolderPlus />
        <span className="hidden sm:inline">New Collection</span>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>Group items of any type under one name.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form starts empty every time. */}
        <CollectionForm
          submitLabel="Create"
          successMessage="Collection created"
          action={createCollection}
          pending={pending}
          startTransition={startTransition}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
