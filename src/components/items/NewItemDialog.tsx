"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type TransitionStartFunction } from "react";
import { toast } from "sonner";

import { createItem } from "@/actions/items";
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
import {
  CREATABLE_ITEM_TYPES,
  getEditableItemFields,
  parseTags,
  type CreatableItemType,
} from "@/lib/item-fields";
import { getItemTypeDisplay } from "@/lib/item-type-display";
import { cn } from "@/lib/utils";
import type { CreateItemInput, CreateItemResult } from "@/types/items";

const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";

type FieldErrors = Extract<CreateItemResult, { success: false }>["fieldErrors"];

export function NewItemDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    // Stays open while saving, so Escape or a backdrop click can't hide a pending create.
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={<Button aria-label="New Item" />}>
        <Plus />
        <span className="hidden sm:inline">New Item</span>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>Save a snippet, prompt, command, note or link.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form starts empty every time. */}
        <NewItemForm
          pending={pending}
          startTransition={startTransition}
          onCreated={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface NewItemFormProps {
  pending: boolean;
  startTransition: TransitionStartFunction;
  onCreated: () => void;
}

function NewItemForm({ pending, startTransition, onCreated }: NewItemFormProps) {
  const router = useRouter();
  const formId = useId();

  const [typeName, setTypeName] = useState<CreatableItemType>("snippet");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const fields = getEditableItemFields(typeName);

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // Only the fields this type has; switching types keeps the others typed in but unsent.
    const input: CreateItemInput = {
      typeName,
      title,
      description,
      tags: parseTags(tags),
      ...(fields.content && { content }),
      ...(fields.language && { language }),
      ...(fields.url && { url }),
    };

    startTransition(async () => {
      let result: CreateItemResult;
      try {
        result = await createItem(input);
      } catch {
        toast.error(NETWORK_ERROR);
        return;
      }

      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      toast.success("Item created");
      onCreated();
      // Shows the new item and updated counts behind the dialog.
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
        <ItemTypePicker value={typeName} onChange={setTypeName} disabled={pending} />
        <FormField
          name="title"
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          errors={fieldErrors?.title}
          required
          autoFocus
        />
        <TextareaField
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          errors={fieldErrors?.description}
          rows={2}
        />
        {fields.content && (
          <TextareaField
            label="Content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            errors={fieldErrors?.content}
            spellCheck={false}
            className="max-h-80 min-h-32 font-mono text-xs leading-relaxed md:text-xs"
          />
        )}
        {fields.language && (
          <FormField
            name="language"
            label="Language"
            placeholder="e.g. typescript"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            errors={fieldErrors?.language}
          />
        )}
        {fields.url && (
          <FormField
            name="url"
            label="URL"
            type="url"
            placeholder="https://"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            errors={fieldErrors?.url}
            required
          />
        )}
        <FormField
          name="tags"
          label="Tags"
          placeholder="react, hooks, auth"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          errors={fieldErrors?.tags}
        />
      </form>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={pending} />}>Cancel</DialogClose>
        <Button type="submit" form={formId} disabled={pending || !title.trim()}>
          {pending && <Loader2 className="animate-spin" />}
          Create
        </Button>
      </DialogFooter>
    </>
  );
}

interface ItemTypePickerProps {
  value: CreatableItemType;
  onChange: (typeName: CreatableItemType) => void;
  disabled: boolean;
}

function ItemTypePicker({ value, onChange, disabled }: ItemTypePickerProps) {
  const labelId = useId();

  return (
    <div className="grid gap-2">
      <span id={labelId} className="text-sm leading-none font-medium">
        Type
      </span>
      <div role="group" aria-labelledby={labelId} className="grid grid-cols-5 gap-1.5">
        {CREATABLE_ITEM_TYPES.map((typeName) => {
          const { icon: Icon, textColor, bgTint } = getItemTypeDisplay(typeName);
          const selected = typeName === value;
          // A plain button: the outline Button's dark-mode background and border would hide the tint.
          return (
            <button
              key={typeName}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(typeName)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-xs font-medium capitalize transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                selected
                  ? cn("border-current", bgTint, textColor)
                  : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4", textColor)} />
              {typeName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
