import { describe, expect, it } from "vitest";

import {
  addTag,
  buildItemInput,
  getEditableItemFields,
  getItemContentType,
  getNewTags,
  isCodeItemType,
  isCreatableItemType,
  isMarkdownItemType,
  parseTags,
} from "@/lib/item-fields";

describe("addTag", () => {
  it("adds to empty and existing tags", () => {
    expect(addTag("", "react")).toBe("react");
    expect(addTag("react,  hooks,", "auth")).toBe("react, hooks, auth");
  });

  it("doesn't repeat a tag", () => {
    expect(addTag("react", "react")).toBe("react");
  });
});

describe("getNewTags", () => {
  it("leaves out tags the form already has, ignoring case", () => {
    expect(getNewTags(["react", "hooks", "auth"], "React, auth")).toEqual(["hooks"]);
  });
});

describe("isCreatableItemType", () => {
  it("is true for the 7 system types the New Item dialog offers", () => {
    for (const typeName of ["snippet", "prompt", "command", "note", "file", "image", "link"]) {
      expect(isCreatableItemType(typeName)).toBe(true);
    }
  });

  it("is false for custom types and other spellings", () => {
    for (const typeName of ["recipe", "Snippet", ""]) {
      expect(isCreatableItemType(typeName)).toBe(false);
    }
  });
});

describe("isCodeItemType", () => {
  it("is true for snippets and commands only", () => {
    expect(isCodeItemType("snippet")).toBe(true);
    expect(isCodeItemType("command")).toBe(true);
    for (const typeName of ["prompt", "note", "link", "file", "image", "recipe"]) {
      expect(isCodeItemType(typeName)).toBe(false);
    }
  });
});

describe("isMarkdownItemType", () => {
  it("is true for prompts and notes only", () => {
    expect(isMarkdownItemType("prompt")).toBe(true);
    expect(isMarkdownItemType("note")).toBe(true);
    for (const typeName of ["snippet", "command", "link", "file", "image", "recipe"]) {
      expect(isMarkdownItemType(typeName)).toBe(false);
    }
  });
});

describe("getItemContentType", () => {
  it("stores links as URLs, files and images as uploads and the rest as text", () => {
    expect(getItemContentType("link")).toBe("URL");
    expect(getItemContentType("file")).toBe("FILE");
    expect(getItemContentType("image")).toBe("FILE");
    for (const typeName of ["snippet", "prompt", "command", "note"] as const) {
      expect(getItemContentType(typeName)).toBe("TEXT");
    }
  });
});

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

describe("buildItemInput", () => {
  const VALUES = {
    title: "useAuth",
    description: "",
    content: "export {}",
    language: "ts",
    url: "https://example.com",
    tags: "react, hooks, react",
    collectionIds: ["col_1"],
  };

  it("sends only the fields the type has, with tags parsed and the collections", () => {
    expect(buildItemInput("snippet", VALUES)).toEqual({
      title: "useAuth",
      description: "",
      tags: ["react", "hooks"],
      collectionIds: ["col_1"],
      content: "export {}",
      language: "ts",
    });
    expect(buildItemInput("link", VALUES)).toEqual({
      title: "useAuth",
      description: "",
      tags: ["react", "hooks"],
      collectionIds: ["col_1"],
      url: "https://example.com",
    });
    expect(buildItemInput("image", VALUES)).toEqual({
      title: "useAuth",
      description: "",
      tags: ["react", "hooks"],
      collectionIds: ["col_1"],
    });
  });
});
