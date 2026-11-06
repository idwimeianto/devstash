import { describe, expect, it } from "vitest";

import {
  buildDescriptionInput,
  hasDescriptionSource,
  parseDescription,
} from "@/lib/ai-description";

describe("hasDescriptionSource", () => {
  it("is true with any of title, content, URL or file name", () => {
    expect(hasDescriptionSource({ title: "a" })).toBe(true);
    expect(hasDescriptionSource({ content: "a" })).toBe(true);
    expect(hasDescriptionSource({ url: "https://a.dev" })).toBe(true);
    expect(hasDescriptionSource({ fileName: "a.pdf" })).toBe(true);
  });

  it("is false when they're blank, even with a type and language", () => {
    expect(hasDescriptionSource({})).toBe(false);
    expect(
      hasDescriptionSource({ title: "  ", content: "\n", typeName: "snippet", language: "go" }),
    ).toBe(false);
  });
});

describe("buildDescriptionInput", () => {
  it("includes only the fields the item has", () => {
    const input = buildDescriptionInput({
      typeName: "link",
      title: "Lucide",
      content: "  ",
      url: "https://lucide.dev",
    });

    expect(input).toContain("<type>link</type>");
    expect(input).toContain("<title>Lucide</title>");
    expect(input).toContain("<url>https://lucide.dev</url>");
    expect(input).not.toContain("<content>");
    expect(input).not.toContain("<file_name>");
    expect(input).not.toContain("<language>");
  });
});

describe("parseDescription", () => {
  it("trims and puts the text on one line", () => {
    expect(parseDescription("  A debounce hook.\n\nUse it for search.  ")).toBe(
      "A debounce hook. Use it for search.",
    );
  });

  it("removes quotes around the whole reply but keeps ones inside", () => {
    expect(parseDescription('"A debounce hook."')).toBe("A debounce hook.");
    expect(parseDescription('Runs "git status" first.')).toBe('Runs "git status" first.');
  });

  it("cuts to the description limit", () => {
    expect(parseDescription("a".repeat(2500))).toHaveLength(2000);
  });

  it("throws on an empty reply", () => {
    expect(() => parseDescription("")).toThrow();
    expect(() => parseDescription(' "" ')).toThrow();
  });
});
