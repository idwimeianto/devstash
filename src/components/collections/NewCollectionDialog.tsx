"use client";

import { FolderPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type TransitionStartFunction } from "react";

import { createCollection } from "@/actions/collections";
import { FormField } from "@/components/auth/FormField";
import { TextareaField } from "@/components/items/TextareaField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { runItemAction } from "@/lib/run-item-action";
import type { CreateCollectionResult } from "@/types/collections";

type CollectionFieldErrors = Extract<CreateCollectionResult, { success: false }>["fieldErrors"];

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
        <NewCollectionForm
          pending={pending}
          startTransition={startTransition}
          onCreated={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface NewCollectionFormProps {
  pending: boolean;
  startTransition: TransitionStartFunction;
  onCreated: () => void;
}

function NewCollectionForm({ pending, startTransition, onCreated }: NewCollectionFormProps) {
  const router = useRouter();
  const formId = useId();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<NonNullable<CollectionFieldErrors>>({});

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const created = await runItemAction(() => createCollection({ name, description }), {
        successMessage: "Collection created",
        onFieldErrors: setFieldErrors,
      });
      if (!created) return;
      onCreated();
      // Shows the new collection and updated counts in the dashboard and sidebar.
      router.refresh();
    });
  }

  return (
    <>
      <form
        id={formId}
        onSubmit={handleSubmit}
        // The server's Zod errors are shown inline instead of the browser's own bubbles.
        noValidate
        className="flex flex-col gap-5"
      >
        <FormField
          name="name"
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          errors={fieldErrors.name}
          disabled={pending}
          required
          autoFocus
        />
        <TextareaField
          name="description"
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          errors={fieldErrors.description}
          disabled={pending}
          rows={3}
        />
      </form>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={pending} />}>Cancel</DialogClose>
        <Button type="submit" form={formId} disabled={pending || !name.trim()}>
          {pending && <Loader2 className="animate-spin" />}
          Create
        </Button>
      </DialogFooter>
    </>
  );
}
