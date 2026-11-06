import { z } from "zod";

import { hasDescriptionSource } from "@/lib/ai-description";
import { ITEM_LIMITS, tooLong } from "@/lib/validations/items";

// Keeps each call cheap; the start of an item is enough to tag it.
export const AI_CONTENT_LIMIT = 2_000;

export const generateAutoTagsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Add a title first")
    .max(ITEM_LIMITS.title, tooLong("Title", ITEM_LIMITS.title)),
  content: z
    .string()
    .optional()
    .transform((content) => content?.slice(0, AI_CONTENT_LIMIT) ?? ""),
});

// Every field is optional, since the forms send what the item has so far. File names can reach
// 255 characters (the upload route's limit).
export const generateDescriptionSchema = z
  .object({
    typeName: z.string().trim().max(50).optional(),
    title: z
      .string()
      .trim()
      .max(ITEM_LIMITS.title, tooLong("Title", ITEM_LIMITS.title))
      .optional(),
    content: z
      .string()
      .optional()
      .transform((content) => content?.slice(0, AI_CONTENT_LIMIT)),
    language: z
      .string()
      .trim()
      .max(ITEM_LIMITS.language, tooLong("Language", ITEM_LIMITS.language))
      .optional(),
    url: z.string().trim().max(ITEM_LIMITS.url, tooLong("URL", ITEM_LIMITS.url)).optional(),
    fileName: z.string().trim().max(255, tooLong("File name", 255)).optional(),
  })
  .refine(hasDescriptionSource, { message: "Add a title or content first" });

export const explainCodeSchema = z.object({
  title: z
    .string()
    .trim()
    .max(ITEM_LIMITS.title, tooLong("Title", ITEM_LIMITS.title))
    .optional(),
  language: z
    .string()
    .trim()
    .max(ITEM_LIMITS.language, tooLong("Language", ITEM_LIMITS.language))
    .optional(),
  content: z
    .string()
    .refine((content) => content.trim().length > 0, "There's no code to explain")
    .transform((content) => content.slice(0, AI_CONTENT_LIMIT)),
});
