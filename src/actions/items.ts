"use server";

import { validationFailure } from "@/lib/action-result";
import { areUserCollections } from "@/lib/db/collections";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  getItemTypeName,
  isFileUrlInUse,
  setItemFavorite as setItemFavoriteQuery,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import { getSessionUserId } from "@/lib/db/users";
import { getStoredContentType, isUploadKind, type UploadKind } from "@/lib/file-upload";
import { getEditableItemFields } from "@/lib/item-fields";
import { GENERIC_ERROR, NOT_SIGNED_IN } from "@/lib/messages";
import { deleteObject, getKeyFromPublicUrl, getObjectSize } from "@/lib/r2";
import { createItemSchema, updateItemSchema } from "@/lib/validations/items";
import type { SetFavoriteResult } from "@/types/favorites";
import type {
  CreateItemInput,
  CreateItemResult,
  DeleteItemResult,
  ItemDetail,
  ItemDetailJson,
  UpdateItemInput,
  UpdateItemResult,
} from "@/types/items";
import type { UploadedFile } from "@/types/uploads";

const UPLOAD_MISSING = "The uploaded file wasn't found. Please upload it again.";
const NOT_FOUND = "This item doesn't exist or was deleted.";
const URL_REQUIRED = "URL is required";
const FILE_IN_USE = "This file already belongs to another item. Please upload it again.";
const COLLECTION_NOT_FOUND = "A selected collection doesn't exist anymore. Please choose again.";

// Another user's collection id looks missing, the same as a deleted one.
async function hasUnknownCollection(userId: string, collectionIds?: string[]) {
  return collectionIds !== undefined && !(await areUserCollections(userId, collectionIds));
}

// Fits both results: collectionIds is a field of UpdateItemInput and CreateItemInput.
function collectionNotFound(): Extract<UpdateItemResult, { success: false }> {
  return {
    success: false,
    error: COLLECTION_NOT_FOUND,
    fieldErrors: { collectionIds: [COLLECTION_NOT_FOUND] },
  };
}

// Same shape GET /api/items/[id] sends, so the drawer can show the result directly.
function toItemDetailJson(item: ItemDetail): ItemDetailJson {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// The upload as it is stored in R2, or null when it isn't one of this user's uploads of
// the right kind. The size comes from R2, not the client.
async function getStoredUpload(
  userId: string,
  kind: UploadKind,
  file: { fileUrl: string; fileName: string },
): Promise<UploadedFile | null> {
  const key = getKeyFromPublicUrl(file.fileUrl);
  if (!key?.startsWith(`${userId}/`) || !getStoredContentType(kind, key)) return null;

  const fileSize = await getObjectSize(key);
  return fileSize === null ? null : { ...file, fileSize };
}

export async function createItem(input: CreateItemInput): Promise<CreateItemResult> {
  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  // Always the session's user, never one from the client.
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  // Drop fields this type doesn't have, even if a client sends them.
  const { content, language, url, file, ...common } = parsed.data;
  const editable = getEditableItemFields(common.typeName);

  try {
    if (await hasUnknownCollection(userId, common.collectionIds)) return collectionNotFound();

    let storedFile: UploadedFile | null = null;
    if (isUploadKind(common.typeName) && file) {
      storedFile = await getStoredUpload(userId, common.typeName, file);
      if (!storedFile) {
        return { success: false, error: UPLOAD_MISSING, fieldErrors: { file: [UPLOAD_MISSING] } };
      }
      // Each upload backs one item, so deleting one item can't break another.
      if (await isFileUrlInUse(userId, storedFile.fileUrl)) {
        return { success: false, error: FILE_IN_USE, fieldErrors: { file: [FILE_IN_USE] } };
      }
    }

    const item = await createItemQuery(userId, {
      ...common,
      content: editable.content ? content : undefined,
      language: editable.language ? language : undefined,
      url: editable.url ? url : undefined,
      file: storedFile ?? undefined,
    });
    return { success: true, data: toItemDetailJson(item) };
  } catch (error) {
    console.error("Creating item failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function updateItem(
  itemId: string,
  input: UpdateItemInput,
): Promise<UpdateItemResult> {
  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  // Always the session's user, never one from the client.
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const typeName = await getItemTypeName(userId, itemId);
    if (!typeName) return { success: false, error: NOT_FOUND };

    // Drop fields this type doesn't have, even if a client sends them.
    const editable = getEditableItemFields(typeName);
    const { content, language, url, ...common } = parsed.data;
    // Same rule as creating: a link can't be saved without its URL (undefined leaves it as is).
    if (typeName === "link" && url === null) {
      return { success: false, error: URL_REQUIRED, fieldErrors: { url: [URL_REQUIRED] } };
    }
    if (await hasUnknownCollection(userId, common.collectionIds)) return collectionNotFound();
    const item = await updateItemQuery(userId, itemId, {
      ...common,
      content: editable.content ? content : undefined,
      language: editable.language ? language : undefined,
      url: editable.url ? url : undefined,
    });
    if (!item) return { success: false, error: NOT_FOUND };

    return { success: true, data: toItemDetailJson(item) };
  } catch (error) {
    console.error("Updating item failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

// Sets rather than flips, so repeated clicks can't drift from what the UI shows.
export async function setItemFavorite(
  itemId: string,
  isFavorite: boolean,
): Promise<SetFavoriteResult> {
  if (typeof itemId !== "string" || !itemId) return { success: false, error: NOT_FOUND };
  if (typeof isFavorite !== "boolean") return { success: false, error: GENERIC_ERROR };

  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const updated = await setItemFavoriteQuery(userId, itemId, isFavorite);
    return updated ? { success: true, data: { isFavorite } } : { success: false, error: NOT_FOUND };
  } catch (error) {
    console.error("Updating item favorite failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  if (typeof itemId !== "string" || !itemId) return { success: false, error: NOT_FOUND };

  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  let deleted: Awaited<ReturnType<typeof deleteItemQuery>>;
  try {
    deleted = await deleteItemQuery(userId, itemId);
  } catch (error) {
    console.error("Deleting item failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
  if (!deleted) return { success: false, error: NOT_FOUND };

  // The item is gone either way; a file left behind in R2 is only logged.
  const key = deleted.fileUrl && getKeyFromPublicUrl(deleted.fileUrl);
  if (deleted.fileUrl && key) {
    try {
      // Kept while another item still points at it (items created before uploads were unique).
      if (!(await isFileUrlInUse(userId, deleted.fileUrl))) await deleteObject(key);
    } catch (error) {
      console.error("Deleting the item's file from R2 failed", error);
    }
  }
  return { success: true };
}
