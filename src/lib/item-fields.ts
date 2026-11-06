export interface EditableItemFields {
  content: boolean;
  language: boolean;
  url: boolean;
}

import { isUploadKind } from "@/lib/file-upload";
import type { UpdateItemInput } from "@/types/items";

// Types the New Item dialog offers, in sidebar order; File and Image are uploads.
export const CREATABLE_ITEM_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
] as const;

export type CreatableItemType = (typeof CREATABLE_ITEM_TYPES)[number];

export function isCreatableItemType(typeName: string): typeName is CreatableItemType {
  return (CREATABLE_ITEM_TYPES as readonly string[]).includes(typeName);
}

const CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPES = new Set(["snippet", "command"]);
const URL_TYPES = new Set(["link"]);
const MARKDOWN_TYPES = new Set(["prompt", "note"]);

// The item's content kind: links store a URL, files and images an upload, the rest text.
export function getItemContentType(typeName: CreatableItemType): "TEXT" | "URL" | "FILE" {
  if (URL_TYPES.has(typeName)) return "URL";
  return isUploadKind(typeName) ? "FILE" : "TEXT";
}

// Snippets and commands hold code, so their content gets the code editor.
export function isCodeItemType(typeName: string): boolean {
  return LANGUAGE_TYPES.has(typeName);
}

// Prompts and notes hold prose, so their content gets the Markdown editor.
export function isMarkdownItemType(typeName: string): boolean {
  return MARKDOWN_TYPES.has(typeName);
}

// Which type-specific fields an item of this type can edit; title, description and tags always can.
export function getEditableItemFields(typeName: string): EditableItemFields {
  return {
    content: CONTENT_TYPES.has(typeName),
    language: LANGUAGE_TYPES.has(typeName),
    url: URL_TYPES.has(typeName),
  };
}

// "react, hooks, react" -> ["react", "hooks"]
export function parseTags(input: string): string[] {
  const tags = input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return [...new Set(tags)];
}

// The form's tags text with one more tag.
export function addTag(tags: string, tag: string): string {
  return [...new Set([...parseTags(tags), tag])].join(", ");
}

// Suggestions the form's tags text doesn't already have, ignoring case.
export function getNewTags(suggestions: string[], tags: string): string[] {
  const existing = new Set(parseTags(tags).map((tag) => tag.toLowerCase()));
  return suggestions.filter((tag) => !existing.has(tag.toLowerCase()));
}

// What the item forms hold: every field as typed, tags as one comma-separated string.
export interface ItemFormValues {
  title: string;
  description: string;
  content: string;
  language: string;
  url: string;
  tags: string;
  collectionIds: string[];
}

// The payload for an item of this type: only the fields it has, so values typed in before
// switching types aren't sent.
export function buildItemInput(typeName: string, values: ItemFormValues): UpdateItemInput {
  const fields = getEditableItemFields(typeName);
  return {
    title: values.title,
    description: values.description,
    tags: parseTags(values.tags),
    collectionIds: values.collectionIds,
    ...(fields.content && { content: values.content }),
    ...(fields.language && { language: values.language }),
    ...(fields.url && { url: values.url }),
  };
}
