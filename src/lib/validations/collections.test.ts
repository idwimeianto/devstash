import { describe, expect, it } from "vitest";

import { COLLECTION_LIMITS, createCollectionSchema } from "@/lib/validations/collections";

describe("createCollectionSchema", () => {
  it("trims the name and stores a blank description as null", () => {
    const result = createCollectionSchema.parse({ name: "  React Patterns  ", description: "   " });

    expect(result).toEqual({ name: "React Patterns", description: null });
  });

  it("requires a name", () => {
    const result = createCollectionSchema.safeParse({ name: "   " });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Name is required");
  });

  it("limits the name and description length", () => {
    const result = createCollectionSchema.safeParse({
      name: "a".repeat(COLLECTION_LIMITS.name + 1),
      description: "a".repeat(COLLECTION_LIMITS.description + 1),
    });

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "Name must be at most 100 characters",
      "Description must be at most 2,000 characters",
    ]);
  });
});
