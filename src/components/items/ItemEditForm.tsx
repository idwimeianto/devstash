"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useTransition } from "react";

import { updateItem } from "@/actions/items";
import { ItemDrawerHeader, ItemMetaSections } from "@/components/items/ItemDrawerParts";
import { ItemFormFields } from "@/components/items/ItemFormFields";
import { Button } from "@/components/ui/button";
import { useItemForm } from "@/hooks/use-item-form";
import { buildItemInput } from "@/lib/item-fields";
import { runItemAction } from "@/lib/run-item-action";
import type { ItemDetailJson } from "@/types/items";

interface ItemEditFormProps {
  item: ItemDetailJson;
  onCancel: () => void;
  onSaved: (item: ItemDetailJson) => void;
}

export function ItemEditForm({ item, onCancel, onSaved }: ItemEditFormProps) {
  const router = useRouter();
  const formId = useId();
  const { values, setField, fieldErrors, setFieldErrors } = useItemForm({
    title: item.title,
    description: item.description ?? "",
    content: item.content ?? "",
    language: item.language ?? "",
    url: item.url ?? "",
    tags: item.tags.join(", "),
    collectionIds: item.collections.map((collection) => collection.id),
  });
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // Only the fields this type has; the server ignores any others too.
    const input = buildItemInput(item.typeName, values);

    startTransition(async () => {
      const saved = await runItemAction(() => updateItem(item.id, input), {
        successMessage: "Item saved",
        onFieldErrors: setFieldErrors,
      });
      if (!saved) return;
      onSaved(saved);
      // Updates the cards behind the drawer.
      router.refresh();
    });
  }

  return (
    <>
      <ItemDrawerHeader item={item}>
        <div className="flex items-center gap-2">
          <Button type="submit" form={formId} size="sm" disabled={pending || !values.title.trim()}>
            {pending && <Loader2 className="animate-spin" />}
            Save
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        </div>
      </ItemDrawerHeader>

      <form
        id={formId}
        onSubmit={handleSubmit}
        // The server's Zod errors are shown inline instead of the browser's own bubbles.
        noValidate
        className="flex flex-1 flex-col gap-6 overflow-y-auto p-6"
      >
        <ItemFormFields
          typeName={item.typeName}
          values={values}
          onChange={setField}
          fieldErrors={fieldErrors}
          fileName={item.fileName ?? undefined}
        />
        <ItemMetaSections item={item} />
      </form>
    </>
  );
}
