import { z } from "zod";

import {
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEMES,
} from "@/lib/editor-preferences";

export const editorPreferencesSchema = z.object({
  fontSize: z.literal(EDITOR_FONT_SIZES, "Choose a font size"),
  tabSize: z.literal(EDITOR_TAB_SIZES, "Choose a tab size"),
  wordWrap: z.boolean("Word wrap must be on or off"),
  minimap: z.boolean("Minimap must be on or off"),
  theme: z.enum(EDITOR_THEMES, "Choose a theme"),
});

export type EditorPreferences = z.output<typeof editorPreferencesSchema>;
