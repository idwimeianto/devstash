import { describe, expect, it } from "vitest";

import {
  DEFAULT_EDITOR_PREFERENCES,
  getEditorLineHeight,
  parseEditorPreferences,
} from "@/lib/editor-preferences";

describe("parseEditorPreferences", () => {
  it("returns the defaults when nothing is stored", () => {
    expect(parseEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(parseEditorPreferences(undefined)).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("keeps valid stored values", () => {
    const stored = { fontSize: 16, tabSize: 4, wordWrap: false, minimap: true, theme: "monokai" };

    expect(parseEditorPreferences(stored)).toEqual(stored);
  });

  it("replaces only the missing or invalid fields with their defaults", () => {
    const stored = { fontSize: 15, tabSize: 8, wordWrap: "yes", theme: "solarized" };

    expect(parseEditorPreferences(stored)).toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      tabSize: 8,
    });
  });

  it("returns the defaults for a value that isn't an object", () => {
    expect(parseEditorPreferences("vs-dark")).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(parseEditorPreferences([12])).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });
});

describe("getEditorLineHeight", () => {
  it("is 1.5 times the font size, rounded", () => {
    expect(getEditorLineHeight(12)).toBe(18);
    expect(getEditorLineHeight(11)).toBe(17);
    expect(getEditorLineHeight(13)).toBe(20);
  });
});
