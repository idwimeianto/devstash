import { z } from "zod";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_EDITOR_PREFERENCES,
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEMES,
} from "@/lib/editor-preferences";
import { editorPreferencesSchema } from "@/lib/validations/editor-preferences";

describe("editorPreferencesSchema", () => {
  it("accepts every offered option", () => {
    for (const fontSize of EDITOR_FONT_SIZES) {
      for (const tabSize of EDITOR_TAB_SIZES) {
        for (const theme of EDITOR_THEMES) {
          const input = { ...DEFAULT_EDITOR_PREFERENCES, fontSize, tabSize, theme };
          expect(editorPreferencesSchema.safeParse(input).success).toBe(true);
        }
      }
    }
  });

  it("reports a message for each invalid field", () => {
    const result = editorPreferencesSchema.safeParse({
      fontSize: "12",
      tabSize: 3,
      wordWrap: "on",
      minimap: null,
      theme: "solarized",
    });

    expect(result.success).toBe(false);
    expect(z.flattenError(result.error!).fieldErrors).toEqual({
      fontSize: ["Choose a font size"],
      tabSize: ["Choose a tab size"],
      wordWrap: ["Word wrap must be on or off"],
      minimap: ["Minimap must be on or off"],
      theme: ["Choose a theme"],
    });
  });

  it("requires every field", () => {
    const withoutTheme: Partial<typeof DEFAULT_EDITOR_PREFERENCES> = {
      ...DEFAULT_EDITOR_PREFERENCES,
    };
    delete withoutTheme.theme;

    expect(editorPreferencesSchema.safeParse(withoutTheme).success).toBe(false);
  });
});
