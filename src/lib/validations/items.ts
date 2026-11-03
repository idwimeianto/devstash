import { z } from "zod";

import { isUploadKind } from "@/lib/file-upload";
import { CREATABLE_ITEM_TYPES } from "@/lib/item-fields";

export const ITEM_LIMITS = {
  title: 200,
  description: 2_000,
  content: 100_000,
  language: 50,
  url: 2_048,
  tag: 50,
  tags: 20,
} as const;

function tooLong(field: string, max: number) {
  return `${field} must be at most ${max.toLocaleString("en-US")} characters`;
}

// Blank optional fields are stored as null, not "".
function optionalText(field: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, tooLong(field, max))
    .transform((value) => value || null)
    .nullable()
    .optional();
}

export const updateItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(ITEM_LIMITS.title, tooLong("Title", ITEM_LIMITS.title)),
  description: optionalText("Description", ITEM_LIMITS.description),
  // Not trimmed: leading whitespace is indentation in code.
  content: z
    .string()
    .max(ITEM_LIMITS.content, tooLong("Content", ITEM_LIMITS.content))
    .transform((value) => (value.trim() ? value : null))
    .nullable()
    .optional(),
  language: optionalText("Language", ITEM_LIMITS.language),
  url: z
    .string()
    .trim()
    .max(ITEM_LIMITS.url, tooLong("URL", ITEM_LIMITS.url))
    .transform((value) => value || null)
    .pipe(z.url("Enter a valid URL").nullable())
    .nullable()
    .optional(),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Tags can't be empty")
        .max(ITEM_LIMITS.tag, `Tags must be at most ${ITEM_LIMITS.tag} characters each`),
    )
    .max(ITEM_LIMITS.tags, `Use at most ${ITEM_LIMITS.tags} tags`)
    .transform((tags) => [...new Set(tags)]),
});

export type UpdateItemData = z.output<typeof updateItemSchema>;

// The upload a file or image item points at, as returned by POST /api/upload.
const uploadedFileSchema = z.object({
  fileUrl: z.url(),
  fileName: z.string().trim().min(1).max(255),
});

export const createItemSchema = updateItemSchema
  .extend({
    typeName: z.enum(CREATABLE_ITEM_TYPES, "Choose a type"),
    file: uploadedFileSchema.optional(),
  })
  .refine((data) => data.typeName !== "link" || data.url, {
    message: "URL is required",
    path: ["url"],
  })
  .refine((data) => !isUploadKind(data.typeName) || data.file, {
    message: "Upload a file",
    path: ["file"],
  });

export type CreateItemData = z.output<typeof createItemSchema>;
