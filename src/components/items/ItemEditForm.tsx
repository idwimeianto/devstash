"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateItem } from "@/actions/items";
import { FormField } from "@/components/auth/FormField";
import { ItemDrawerHeader, ItemMetaSections } from "@/components/items/ItemDetailView";
import { CodeEditorField } from "@/components/items/CodeEditorField";
import { MarkdownEditorField } from "@/components/items/MarkdownEditorField";
import { TextareaField } from "@/components/items/TextareaField";
import { Button } from "@/components/ui/button";
import {
  getEditableItemFields,
  isCodeItemType,
  isMarkdownItemType,
  parseTags,
} from "@/lib/item-fields";
import type { ItemDetailJson, UpdateItemInput, UpdateItemResult } from "@/types/items";

const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";

type FieldErrors = Extract<UpdateItemResult, { success: false }>["fieldErrors"];

interface ItemEditFormProps {
  item: ItemDetailJson;
  onCancel: () => void;
  onSaved: (item: ItemDetailJson) => void;
}

export function ItemEditForm({ item, onCancel, onSaved }: ItemEditFormProps) {
  const router = useRouter();
  const formId = useId();
  const editable = getEditableItemFields(item.typeName);

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [content, setContent] = useState(item.content ?? "");
  const [language, setLanguage] = useState(item.language ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [tags, setTags] = useState(item.tags.join(", "));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // Only the fields this type has; the server ignores any others too.
    const input: UpdateItemInput = {
      title,
      description,
      tags: parseTags(tags),
      ...(editable.content && { content }),
      ...(editable.language && { language }),
      ...(editable.url && { url }),
    };

    startTransition(async () => {
      let result: UpdateItemResult;
      try {
        result = await updateItem(item.id, input);
      } catch {
        toast.error(NETWORK_ERROR);
        return;
      }

      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      toast.success("Item saved");
      onSaved(result.data);
      // Updates the cards behind the drawer.
      router.refresh();
    });
  }

  return (
    <>
      <ItemDrawerHeader item={item}>
        <div className="flex items-center gap-2">
          <Button type="submit" form={formId} size="sm" disabled={pending || !title.trim()}>
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
        <FormField
          name="title"
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          errors={fieldErrors?.title}
          required
        />
        <TextareaField
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          errors={fieldErrors?.description}
          rows={2}
        />
        {editable.content && isCodeItemType(item.typeName) && (
          <CodeEditorField
            label="Content"
            value={content}
            language={language}
            onChange={setContent}
            errors={fieldErrors?.content}
          />
        )}
        {editable.content && isMarkdownItemType(item.typeName) && (
          <MarkdownEditorField
            label="Content"
            value={content}
            onChange={setContent}
            errors={fieldErrors?.content}
          />
        )}
        {editable.language && (
          <FormField
            name="language"
            label="Language"
            placeholder="e.g. typescript"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            errors={fieldErrors?.language}
          />
        )}
        {editable.url && (
          <FormField
            name="url"
            label="URL"
            type="url"
            placeholder="https://"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            errors={fieldErrors?.url}
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
        <ItemMetaSections item={item} />
      </form>
    </>
  );
}
