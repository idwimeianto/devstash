import { describe, expect, it } from "vitest";

import { getEditableItemFields, parseTags } from "@/lib/item-fields";

describe("getEditableItemFields", () => {
  it("gives snippets and commands content and language", () => {
    expect(getEditableItemFields("snippet")).toEqual({ content: true, language: true, url: false });
    expect(getEditableItemFields("command")).toEqual({ content: true, language: true, url: false });
  });

  it("gives prompts and notes content only", () => {
    expect(getEditableItemFields("prompt")).toEqual({ content: true, language: false, url: false });
    expect(getEditableItemFields("note")).toEqual({ content: true, language: false, url: false });
  });

  it("gives links a URL only", () => {
    expect(getEditableItemFields("link")).toEqual({ content: false, language: false, url: true });
  });

  it("gives file types and unknown types no type-specific fields", () => {
    const none = { content: false, language: false, url: false };
    expect(getEditableItemFields("file")).toEqual(none);
    expect(getEditableItemFields("recipe")).toEqual(none);
  });
});

describe("parseTags", () => {
  it("splits on commas and trims", () => {
    expect(parseTags(" react,hooks , auth ")).toEqual(["react", "hooks", "auth"]);
  });

  it("drops empty entries and duplicates", () => {
    expect(parseTags("react,, ,react, hooks,")).toEqual(["react", "hooks"]);
  });

  it("returns no tags for a blank input", () => {
    expect(parseTags("   ")).toEqual([]);
  });
});
