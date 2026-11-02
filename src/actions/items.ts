"use server";

import { z } from "zod";

import { getItemTypeName, updateItem as updateItemQuery } from "@/lib/db/items";
import { getSessionUserId } from "@/lib/db/users";
import { getEditableItemFields } from "@/lib/item-fields";
import { updateItemSchema } from "@/lib/validations/items";
import type { ItemDetail, ItemDetailJson, UpdateItemInput, UpdateItemResult } from "@/types/items";

const NOT_SIGNED_IN = "You're not signed in. Please sign in again.";
const NOT_FOUND = "This item doesn't exist or was deleted.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

// Same shape GET /api/items/[id] sends, so the drawer can show the result directly.
function toItemDetailJson(item: ItemDetail): ItemDetailJson {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function updateItem(
  itemId: string,
  input: UpdateItemInput,
): Promise<UpdateItemResult> {
  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // Always the session's user, never one from the client.
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const typeName = await getItemTypeName(userId, itemId);
    if (!typeName) return { success: false, error: NOT_FOUND };

    // Drop fields this type doesn't have, even if a client sends them.
    const editable = getEditableItemFields(typeName);
    const { content, language, url, ...common } = parsed.data;
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
