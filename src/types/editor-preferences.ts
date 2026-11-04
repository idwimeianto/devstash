import type { EditorPreferences } from "@/lib/validations/editor-preferences";

export type { EditorPreferences };

export type UpdateEditorPreferencesResult =
  | { success: true; data: EditorPreferences }
  | { success: false; error: string };
