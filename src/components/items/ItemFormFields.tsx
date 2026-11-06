"use client";

import { SuggestTags } from "@/components/ai/SuggestTags";
import { FormField } from "@/components/auth/FormField";
import { CodeEditorField } from "@/components/items/CodeEditorField";
import { CollectionPicker } from "@/components/items/CollectionPicker";
import { LanguageSelect } from "@/components/items/LanguageSelect";
import { MarkdownEditorField } from "@/components/items/MarkdownEditorField";
import { TextareaField } from "@/components/items/TextareaField";
import type { ItemFieldErrors, SetItemField } from "@/hooks/use-item-form";
import {
  getEditableItemFields,
  isCodeItemType,
  isMarkdownItemType,
  type ItemFormValues,
} from "@/lib/item-fields";

interface ItemFormFieldsProps {
  typeName: string;
  values: ItemFormValues;
  onChange: SetItemField;
  fieldErrors: ItemFieldErrors;
  autoFocusTitle?: boolean;
  // Shown after the content field, e.g. the upload for file and image items.
  fileField?: React.ReactNode;
}

// The fields the New Item dialog and the drawer's edit form share; the type decides which
// optional ones appear and which editor the content gets.
export function ItemFormFields({
  typeName,
  values,
  onChange,
  fieldErrors,
  autoFocusTitle = false,
  fileField,
}: ItemFormFieldsProps) {
  const fields = getEditableItemFields(typeName);

  return (
    <>
      <FormField
        name="title"
        label="Title"
        value={values.title}
        onChange={(event) => onChange("title", event.target.value)}
        errors={fieldErrors.title}
        required
        autoFocus={autoFocusTitle}
      />
      <TextareaField
        label="Description"
        value={values.description}
        onChange={(event) => onChange("description", event.target.value)}
        errors={fieldErrors.description}
        rows={2}
      />
      {fields.language && (
        <LanguageSelect
          value={values.language}
          onChange={(language) => onChange("language", language)}
          errors={fieldErrors.language}
        />
      )}
      {fields.content && isCodeItemType(typeName) && (
        <CodeEditorField
          label="Content"
          value={values.content}
          language={values.language}
          onChange={(value) => onChange("content", value)}
          errors={fieldErrors.content}
        />
      )}
      {fields.content && isMarkdownItemType(typeName) && (
        <MarkdownEditorField
          label="Content"
          value={values.content}
          onChange={(value) => onChange("content", value)}
          errors={fieldErrors.content}
        />
      )}
      {fileField}
      {fields.url && (
        <FormField
          name="url"
          label="URL"
          type="url"
          placeholder="https://"
          value={values.url}
          onChange={(event) => onChange("url", event.target.value)}
          errors={fieldErrors.url}
          required
        />
      )}
      <FormField
        name="tags"
        label="Tags"
        placeholder="react, hooks, auth"
        value={values.tags}
        onChange={(event) => onChange("tags", event.target.value)}
        errors={fieldErrors.tags}
      />
      <SuggestTags
        title={values.title}
        // Switching types keeps typed content, but only send it when this type has content.
        content={fields.content ? values.content : ""}
        tags={values.tags}
        onTagsChange={(tags) => onChange("tags", tags)}
      />
      <CollectionPicker
        value={values.collectionIds}
        onChange={(collectionIds) => onChange("collectionIds", collectionIds)}
        errors={fieldErrors.collectionIds}
      />
    </>
  );
}
