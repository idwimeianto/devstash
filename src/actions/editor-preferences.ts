"use server";

import {
  getSessionUserId,
  updateEditorPreferences as updateEditorPreferencesQuery,
} from "@/lib/db/users";
import { GENERIC_ERROR, NOT_SIGNED_IN } from "@/lib/messages";
import { editorPreferencesSchema } from "@/lib/validations/editor-preferences";
import type {
  EditorPreferences,
  UpdateEditorPreferencesResult,
} from "@/types/editor-preferences";

// Saves the whole set: the settings form sends every field on each change.
export async function updateEditorPreferences(
  input: EditorPreferences,
): Promise<UpdateEditorPreferencesResult> {
  const parsed = editorPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  // Always the session's user, never one from the client.
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const updated = await updateEditorPreferencesQuery(userId, parsed.data);
    if (!updated) return { success: false, error: "This account no longer exists." };
    return { success: true, data: parsed.data };
  } catch (error) {
    console.error("Saving editor preferences failed", error);
    return { success: false, error: GENERIC_ERROR };
  }
}
