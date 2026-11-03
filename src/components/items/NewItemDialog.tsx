"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type TransitionStartFunction,
} from "react";

import { createItem } from "@/actions/items";
import { FileUpload } from "@/components/items/FileUpload";
import { ItemFormFields } from "@/components/items/ItemFormFields";
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
import { useItemForm } from "@/hooks/use-item-form";
import { isUploadKind } from "@/lib/file-upload";
import {
  buildItemInput,
  CREATABLE_ITEM_TYPES,
  type CreatableItemType,
} from "@/lib/item-fields";
import { getItemTypeDisplay } from "@/lib/item-type-display";
import { runItemAction } from "@/lib/run-item-action";
import { discardUpload } from "@/lib/upload-client";
import { cn } from "@/lib/utils";
import type { CreateItemInput } from "@/types/items";
import type { UploadedFile } from "@/types/uploads";

interface NewItemDialogProps {
  // Type selected when the dialog opens; it can still be changed in the picker.
  defaultType?: CreatableItemType;
  label?: string;
  // The top bar shows only the icon on small screens.
  iconOnlyOnMobile?: boolean;
}

export function NewItemDialog({
  defaultType = "snippet",
  label = "New Item",
  iconOnlyOnMobile = false,
}: NewItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    // Stays open while saving, so Escape or a backdrop click can't hide a pending create.
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={<Button aria-label={label} />}>
        <Plus />
        <span className={cn(iconOnlyOnMobile && "hidden sm:inline")}>{label}</span>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>
            Save a snippet, prompt, command, note, file, image or link.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form starts empty every time. */}
        <NewItemForm
          defaultType={defaultType}
          pending={pending}
          startTransition={startTransition}
          onCreated={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface NewItemFormProps {
  defaultType: CreatableItemType;
  pending: boolean;
  startTransition: TransitionStartFunction;
  onCreated: () => void;
}

function NewItemForm({ defaultType, pending, startTransition, onCreated }: NewItemFormProps) {
  const router = useRouter();
  const formId = useId();

  const [typeName, setTypeName] = useState<CreatableItemType>(defaultType);
  const { values, setField, fieldErrors, setFieldErrors } = useItemForm();
  const [upload, setUpload] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadKind = isUploadKind(typeName) ? typeName : null;

  // An upload that hasn't become an item yet is removed when the dialog closes.
  const unusedUpload = useRef<UploadedFile | null>(null);
  useEffect(() => {
    unusedUpload.current = upload;
  }, [upload]);
  useEffect(
    () => () => {
      if (unusedUpload.current) discardUpload(unusedUpload.current.fileUrl);
    },
    [],
  );

  // A file uploaded as one type can't be used by another, so switching types drops it.
  function changeType(next: CreatableItemType) {
    if (next === typeName) return;
    if (upload) discardUpload(upload.fileUrl);
    setUpload(null);
    setTypeName(next);
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // Only the fields this type has; switching types keeps the others typed in but unsent.
    const input: CreateItemInput = {
      typeName,
      ...buildItemInput(typeName, values),
      ...(uploadKind && upload && { file: { fileUrl: upload.fileUrl, fileName: upload.fileName } }),
    };

    startTransition(async () => {
      const created = await runItemAction(() => createItem(input), {
        successMessage: "Item created",
        onFieldErrors: setFieldErrors,
      });
      if (!created) return;
      // The upload now belongs to the item, so closing the dialog mustn't remove it.
      unusedUpload.current = null;
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
        <ItemTypePicker value={typeName} onChange={changeType} disabled={pending || uploading} />
        <ItemFormFields
          typeName={typeName}
          values={values}
          onChange={setField}
          fieldErrors={fieldErrors}
          autoFocusTitle
          fileField={
            uploadKind && (
              <FileUpload
                kind={uploadKind}
                value={upload}
                onChange={setUpload}
                onUploadingChange={setUploading}
                disabled={pending}
                errors={fieldErrors.file}
              />
            )
          }
        />
      </form>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={pending} />}>Cancel</DialogClose>
        <Button
          type="submit"
          form={formId}
          disabled={
            pending || uploading || !values.title.trim() || (uploadKind !== null && !upload)
          }
        >
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
      <div role="group" aria-labelledby={labelId} className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
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
