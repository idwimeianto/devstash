import { z } from "zod";

import { optionalText, tooLong } from "@/lib/validations/items";

export const COLLECTION_LIMITS = {
  name: 100,
  description: 2_000,
} as const;

export const createCollectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(COLLECTION_LIMITS.name, tooLong("Name", COLLECTION_LIMITS.name)),
  description: optionalText("Description", COLLECTION_LIMITS.description),
});

export type CreateCollectionData = z.output<typeof createCollectionSchema>;
