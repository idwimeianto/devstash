import { describe, expect, it } from "vitest";

import { buildExplainInput, parseExplanation } from "@/lib/ai-explain";

describe("buildExplainInput", () => {
  it("tags the fields the item has and leaves out the blank ones", () => {
    const input = buildExplainInput({ title: "Docker Cleanup", language: " ", content: "ls -la" });

    expect(input).toContain("<title>Docker Cleanup</title>");
    expect(input).toContain("<content>ls -la</content>");
    expect(input).not.toContain("<language>");
  });
});

describe("parseExplanation", () => {
  it("keeps the Markdown's line breaks and trims the ends", () => {
    expect(parseExplanation("\nIt lists files.\n\n- `-l` long format\n")).toBe(
      "It lists files.\n\n- `-l` long format",
    );
  });

  it("throws on an empty reply", () => {
    expect(() => parseExplanation(" \n")).toThrow();
  });
});
