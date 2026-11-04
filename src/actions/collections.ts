"use server";

import { validationFailure } from "@/lib/action-result";
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  getCollectionOptions as getCollectionOptionsQuery,
  setCollectionFavorite as setCollectionFavoriteQuery,
  updateCollection as updateCollectionQuery,
} from "@/lib/db/collections";
import { getSessionUserId } from "@/lib/db/users";
import { GENERIC_ERROR, NOT_SIGNED_IN } from "@/lib/messages";
import { createCollectionSchema, updateCollectionSchema } from "@/lib/validations/collections";
import type {
  CollectionOptionsResult,
  CreateCollectionInput,
  CreateCollectionResult,
  DeleteCollectionResult,
  UpdateCollectionInput,
  UpdateCollectionResult,
} from "@/types/collections";
import type { SetFavoriteResult } from "@/types/favorites";

const NOT_FOUND = "This collection doesn't exist or was deleted.";

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

export async function updateCollection(
  collectionId: string,
  input: UpdateCollectionInput,
): Promise<UpdateCollectionResult> {
  if (typeof collectionId !== "string" || !collectionId) {
    return { success: false, error: NOT_FOUND };
  }
  const parsed = updateCollectionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const collection = await updateCollectionQuery(userId, collectionId, parsed.data);
    if (!collection) return { success: false, error: NOT_FOUND };
    return { success: true, data: collection };
  } catch (error) {
    console.error("Updating collection failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

// Sets rather than flips, so repeated clicks can't drift from what the UI shows.
export async function setCollectionFavorite(
  collectionId: string,
  isFavorite: boolean,
): Promise<SetFavoriteResult> {
  if (typeof collectionId !== "string" || !collectionId) {
    return { success: false, error: NOT_FOUND };
  }
  if (typeof isFavorite !== "boolean") return { success: false, error: GENERIC_ERROR };

  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const updated = await setCollectionFavoriteQuery(userId, collectionId, isFavorite);
    return updated ? { success: true, data: { isFavorite } } : { success: false, error: NOT_FOUND };
  } catch (error) {
    console.error("Updating collection favorite failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

// Deletes only the collection: its items stay and just leave it.
export async function deleteCollection(collectionId: string): Promise<DeleteCollectionResult> {
  if (typeof collectionId !== "string" || !collectionId) {
    return { success: false, error: NOT_FOUND };
  }

  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const deleted = await deleteCollectionQuery(userId, collectionId);
    return deleted ? { success: true } : { success: false, error: NOT_FOUND };
  } catch (error) {
    console.error("Deleting collection failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}
