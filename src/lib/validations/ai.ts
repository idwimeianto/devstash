import { z } from "zod";

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
