import { z } from "zod";

import type { EditorPreferences } from "@/lib/validations/editor-preferences";

export const EDITOR_FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20] as const;
export const EDITOR_TAB_SIZES = [2, 4, 8] as const;
export const EDITOR_THEMES = ["vs-dark", "monokai", "github-dark"] as const;

export type EditorTheme = (typeof EDITOR_THEMES)[number];

export const EDITOR_THEME_LABELS: Record<EditorTheme, string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark",
};

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 12,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

// The stored JSON is null until the user changes something and may hold values an older
// version allowed, so each field falls back to its default on its own.
const storedEditorPreferencesSchema = z
  .object({
    fontSize: z.literal(EDITOR_FONT_SIZES).catch(DEFAULT_EDITOR_PREFERENCES.fontSize),
    tabSize: z.literal(EDITOR_TAB_SIZES).catch(DEFAULT_EDITOR_PREFERENCES.tabSize),
    wordWrap: z.boolean().catch(DEFAULT_EDITOR_PREFERENCES.wordWrap),
    minimap: z.boolean().catch(DEFAULT_EDITOR_PREFERENCES.minimap),
    theme: z.enum(EDITOR_THEMES).catch(DEFAULT_EDITOR_PREFERENCES.theme),
  })
  .catch(DEFAULT_EDITOR_PREFERENCES);

export function parseEditorPreferences(stored: unknown): EditorPreferences {
  return storedEditorPreferencesSchema.parse(stored ?? {});
}

// 1.5× the font size, so the default 12px keeps its 18px lines.
export function getEditorLineHeight(fontSize: number): number {
  return Math.round(fontSize * 1.5);
}
