"use server";

import { validationFailure } from "@/lib/action-result";
import {
  createCollection as createCollectionQuery,
  getCollectionOptions as getCollectionOptionsQuery,
} from "@/lib/db/collections";
import { getSessionUserId } from "@/lib/db/users";
import { GENERIC_ERROR, NOT_SIGNED_IN } from "@/lib/messages";
import { createCollectionSchema } from "@/lib/validations/collections";
import type {
  CollectionOptionsResult,
  CreateCollectionInput,
  CreateCollectionResult,
} from "@/types/collections";

// The signed-in user's collections for the item forms' collection picker.
export async function getCollectionOptions(): Promise<CollectionOptionsResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    return { success: true, data: await getCollectionOptionsQuery(userId) };
  } catch (error) {
    console.error("Loading collections failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function createCollection(
  input: CreateCollectionInput,
): Promise<CreateCollectionResult> {
  const parsed = createCollectionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  // Always the session's user, never one from the client.
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const collection = await createCollectionQuery(userId, parsed.data);
    return { success: true, data: collection };
  } catch (error) {
    console.error("Creating collection failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}
