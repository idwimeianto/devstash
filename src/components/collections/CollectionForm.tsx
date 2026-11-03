"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type TransitionStartFunction } from "react";

import { FormField } from "@/components/auth/FormField";
import { TextareaField } from "@/components/items/TextareaField";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { runItemAction } from "@/lib/run-item-action";
import type { CreateCollectionInput, CreateCollectionResult } from "@/types/collections";

type CollectionFieldErrors = Extract<CreateCollectionResult, { success: false }>["fieldErrors"];

interface CollectionFormProps {
  initialValues?: { name: string; description: string | null };
  submitLabel: string;
  successMessage: string;
  action: (input: CreateCollectionInput) => Promise<CreateCollectionResult>;
  pending: boolean;
  startTransition: TransitionStartFunction;
  onSaved: () => void;
}

// The name and description form shared by the new and edit collection dialogs.
export function CollectionForm({
  initialValues,
  submitLabel,
  successMessage,
  action,
  pending,
  startTransition,
  onSaved,
}: CollectionFormProps) {
  const router = useRouter();
  const formId = useId();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [fieldErrors, setFieldErrors] = useState<NonNullable<CollectionFieldErrors>>({});

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const saved = await runItemAction(() => action({ name, description }), {
        successMessage,
        onFieldErrors: setFieldErrors,
      });
      if (!saved) return;
      onSaved();
      // Shows the saved collection and updated counts on the page, cards and sidebar.
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
          {submitLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
