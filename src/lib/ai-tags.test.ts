import { describe, expect, it } from "vitest";

import { buildAutoTagInput, parseTagSuggestions } from "@/lib/ai-tags";

describe("buildAutoTagInput", () => {
  it("includes the word JSON, which the API requires in the input", () => {
    const input = buildAutoTagInput("useDebounce", "const a = 1;");

    expect(input).toContain("JSON");
    expect(input).toContain("<title>useDebounce</title>");
    expect(input).toContain("<content>const a = 1;</content>");
  });
});

describe("parseTagSuggestions", () => {
  it("reads both reply formats", () => {
    expect(parseTagSuggestions('{"tags": ["react", "hooks"]}')).toEqual(["react", "hooks"]);
    expect(parseTagSuggestions('["react", "hooks"]')).toEqual(["react", "hooks"]);
  });

  it("lowercases, trims and removes duplicates", () => {
    expect(parseTagSuggestions('["React", " react ", "HOOKS"]')).toEqual(["react", "hooks"]);
  });

  it("drops entries that can't be tags", () => {
    const tooLong = "a".repeat(51);
    expect(parseTagSuggestions(JSON.stringify(["ok", 1, null, "", "a, b", tooLong]))).toEqual([
      "ok",
    ]);
  });

  it("keeps at most 5 tags", () => {
    expect(parseTagSuggestions('["a", "b", "c", "d", "e", "f"]')).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);
  });

  it("throws on replies that aren't a list of tags", () => {
    expect(() => parseTagSuggestions("")).toThrow();
    expect(() => parseTagSuggestions("not json")).toThrow();
    expect(() => parseTagSuggestions('{"labels": ["a"]}')).toThrow();
    expect(() => parseTagSuggestions("null")).toThrow();
  });
});
