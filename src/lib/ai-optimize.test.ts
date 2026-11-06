import { describe, expect, it } from "vitest";

import { buildOptimizeInput, parseOptimizedPrompt } from "@/lib/ai-optimize";

describe("buildOptimizeInput", () => {
  it("wraps the prompt in tags and mentions JSON, which JSON mode needs", () => {
    const input = buildOptimizeInput("Review {{code}}");

    expect(input).toContain("<prompt>Review {{code}}</prompt>");
    expect(input).toContain("JSON");
  });
});

describe("parseOptimizedPrompt", () => {
  it("returns the trimmed prompt and cleaned changes, at most 5", () => {
    const reply = JSON.stringify({
      optimized: "\nBetter prompt\n",
      changes: [" One ", 2, "", "Two", "Three", "Four", "Five", "Six"],
    });

    expect(parseOptimizedPrompt(reply, "Prompt")).toEqual({
      optimized: "Better prompt",
      changes: ["One", "Two", "Three", "Four", "Five"],
    });
  });

  it("still returns the prompt when the changes are missing", () => {
    expect(parseOptimizedPrompt('{"optimized": "Better"}', "Prompt")).toEqual({
      optimized: "Better",
      changes: [],
    });
  });

  it("returns a null prompt when only the surrounding space differs", () => {
    const reply = JSON.stringify({ optimized: "Prompt", changes: ["Nothing really"] });

    expect(parseOptimizedPrompt(reply, "  Prompt\n")).toEqual({ optimized: null, changes: [] });
  });

  it("removes prompt tags wrapped around the whole reply", () => {
    const wrapped = (text: string) => JSON.stringify({ optimized: `<prompt>${text}</prompt>` });

    expect(parseOptimizedPrompt(wrapped("\nBetter\n"), "Prompt").optimized).toBe("Better");
    expect(parseOptimizedPrompt(wrapped("Prompt"), "Prompt").optimized).toBeNull();
  });

  it("throws when the reply repeats the input's tags, unless the prompt itself uses them", () => {
    const reply = JSON.stringify({ optimized: "Improve: <prompt>fix my code</prompt>" });

    expect(() => parseOptimizedPrompt(reply, "fix my code")).toThrow();
    expect(parseOptimizedPrompt(reply, "Fill in <prompt> here").optimized).toContain("<prompt>");
  });

  it("throws on a reply without a usable prompt", () => {
    expect(() => parseOptimizedPrompt('{"optimized": "  "}', "Prompt")).toThrow();
    expect(() => parseOptimizedPrompt('{"optimized": 1}', "Prompt")).toThrow();
    expect(() => parseOptimizedPrompt("null", "Prompt")).toThrow();
    expect(() => parseOptimizedPrompt('{"optimized": "Bet', "Prompt")).toThrow();
  });
});
