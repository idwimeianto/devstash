import { describe, expect, it } from "vitest";

import { PREVIEW_LENGTH, toContentPreview } from "@/lib/search";
import { searchFilter } from "@/lib/search-filter";

describe("toContentPreview", () => {
  it("uses the first non-empty text, collapsed to one line", () => {
    expect(toContentPreview(null, "  \n ", "line one\n\tline two", "ignored")).toBe(
      "line one line two"
    );
  });

  it("returns null when every text is empty", () => {
    expect(toContentPreview(null, undefined, "", "   ")).toBeNull();
  });

  it("cuts long text to PREVIEW_LENGTH with an ellipsis", () => {
    const preview = toContentPreview("x".repeat(PREVIEW_LENGTH + 10));

    expect(preview).toHaveLength(PREVIEW_LENGTH);
    expect(preview?.endsWith("…")).toBe(true);
  });
});

describe("searchFilter", () => {
  it("matches fuzzily against the keywords", () => {
    expect(searchFilter("item:abc", "uath", ["useAuth Hook"])).toBeGreaterThan(0);
    expect(searchFilter("item:abc", "docker", ["useAuth Hook", "snippet"])).toBe(0);
  });

  it("ignores the value, which only holds the id", () => {
    expect(searchFilter("item:cm123xyz", "cm123", ["useAuth Hook"])).toBe(0);
  });
});
