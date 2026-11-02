import { z } from "zod";

import { CREATABLE_ITEM_TYPES } from "@/lib/item-fields";

// Blank optional fields are stored as null, not "".
const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null)
  .nullable()
  .optional();

export const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: optionalText,
  // Not trimmed: leading whitespace is indentation in code.
  content: z
    .string()
    .transform((value) => (value.trim() ? value : null))
    .nullable()
    .optional(),
  language: optionalText,
  url: z
    .string()
    .trim()
    .transform((value) => value || null)
    .pipe(z.url("Enter a valid URL").nullable())
    .nullable()
    .optional(),
  tags: z
    .array(z.string().trim().min(1, "Tags can't be empty"))
    .transform((tags) => [...new Set(tags)]),
});

export type UpdateItemData = z.output<typeof updateItemSchema>;

export const createItemSchema = updateItemSchema
  .extend({ typeName: z.enum(CREATABLE_ITEM_TYPES, "Choose a type") })
  .refine((data) => data.typeName !== "link" || data.url, {
    message: "URL is required",
    path: ["url"],
  });

export type CreateItemData = z.output<typeof createItemSchema>;
