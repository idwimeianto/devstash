import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createItemSchema, ITEM_LIMITS, updateItemSchema } from "@/lib/validations/items";

const VALID = { title: "useAuth Hook", description: null, tags: [] };

describe("updateItemSchema", () => {
  it("trims the title and rejects a blank one", () => {
    expect(updateItemSchema.parse({ ...VALID, title: "  useAuth  " }).title).toBe("useAuth");

    const result = updateItemSchema.safeParse({ ...VALID, title: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Title is required");
  });

  it("stores blank optional fields as null", () => {
    const data = updateItemSchema.parse({
      ...VALID,
      description: "  ",
      content: "\n  \n",
      language: "",
      url: " ",
    });
    expect(data).toMatchObject({ description: null, content: null, language: null, url: null });
  });

  it("keeps content whitespace, which is indentation in code", () => {
    const content = "  if (x) {\n    run();\n  }\n";
    expect(updateItemSchema.parse({ ...VALID, content }).content).toBe(content);
  });

  it("leaves fields that weren't sent undefined, so they aren't changed", () => {
    const data = updateItemSchema.parse(VALID);
    expect(data.content).toBeUndefined();
    expect(data.language).toBeUndefined();
    expect(data.url).toBeUndefined();
  });

  it("accepts any valid URL and rejects anything else", () => {
    expect(updateItemSchema.parse({ ...VALID, url: " https://ui.shadcn.com " }).url).toBe(
      "https://ui.shadcn.com",
    );
    expect(updateItemSchema.safeParse({ ...VALID, url: "mailto:a@b.com" }).success).toBe(true);

    const result = updateItemSchema.safeParse({ ...VALID, url: "ui.shadcn.com" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter a valid URL");
  });

  it("trims tags, removes duplicates and rejects empty ones", () => {
    expect(updateItemSchema.parse({ ...VALID, tags: [" react", "react ", "hooks"] }).tags).toEqual([
      "react",
      "hooks",
    ]);
    expect(updateItemSchema.safeParse({ ...VALID, tags: ["react", " "] }).success).toBe(false);
  });

  it("accepts fields at their limits and rejects longer ones", () => {
    const atLimits = {
      title: "t".repeat(ITEM_LIMITS.title),
      description: "d".repeat(ITEM_LIMITS.description),
      content: "c".repeat(ITEM_LIMITS.content),
      language: "l".repeat(ITEM_LIMITS.language),
      url: `https://example.com/${"u".repeat(ITEM_LIMITS.url - 20)}`,
      tags: Array.from({ length: ITEM_LIMITS.tags }, (_, i) => `${i}`.padEnd(ITEM_LIMITS.tag, "x")),
    };
    expect(updateItemSchema.safeParse(atLimits).success).toBe(true);

    const result = updateItemSchema.safeParse({
      title: `${atLimits.title}t`,
      description: `${atLimits.description}d`,
      content: `${atLimits.content}c`,
      language: `${atLimits.language}l`,
      url: `${atLimits.url}u`,
      tags: [`${atLimits.tags[0]}x`],
    });
    expect(result.error && z.flattenError(result.error).fieldErrors).toEqual({
      title: ["Title must be at most 200 characters"],
      description: ["Description must be at most 2,000 characters"],
      content: ["Content must be at most 100,000 characters"],
      language: ["Language must be at most 50 characters"],
      url: ["URL must be at most 2,048 characters"],
      tags: ["Tags must be at most 50 characters each"],
    });
  });

  it("rejects more than 20 tags", () => {
    const tags = Array.from({ length: ITEM_LIMITS.tags + 1 }, (_, i) => `tag${i}`);
    const result = updateItemSchema.safeParse({ ...VALID, tags });
    expect(result.error?.issues[0]?.message).toBe("Use at most 20 tags");
  });

  it("deduplicates collection ids, keeps an unsent list undefined and limits the count", () => {
    expect(updateItemSchema.parse({ ...VALID, collectionIds: ["c1", "c2", "c1"] }).collectionIds)
      .toEqual(["c1", "c2"]);
    expect(updateItemSchema.parse(VALID).collectionIds).toBeUndefined();
    expect(updateItemSchema.safeParse({ ...VALID, collectionIds: [""] }).success).toBe(false);

    const collectionIds = Array.from({ length: ITEM_LIMITS.collections + 1 }, (_, i) => `c${i}`);
    const result = updateItemSchema.safeParse({ ...VALID, collectionIds });
    expect(result.error?.issues[0]?.message).toBe("Choose at most 100 collections");
  });
});

describe("createItemSchema", () => {
  it("accepts the creatable types with the same field rules as editing", () => {
    const data = createItemSchema.parse({ ...VALID, typeName: "note", title: " Ideas ", content: "x" });
    expect(data).toMatchObject({ typeName: "note", title: "Ideas", content: "x" });
  });

  it("rejects unknown types", () => {
    const result = createItemSchema.safeParse({ ...VALID, typeName: "recipe" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Choose a type");
  });

  it("requires an upload for files and images", () => {
    const file = { fileUrl: "https://pub-test.r2.dev/user_1/abc.png", fileName: " diagram.png " };

    for (const typeName of ["file", "image"]) {
      const result = createItemSchema.safeParse({ ...VALID, typeName });
      expect(result.error?.issues[0]).toMatchObject({ message: "Upload a file", path: ["file"] });
    }
    expect(createItemSchema.parse({ ...VALID, typeName: "image", file }).file).toEqual({
      fileUrl: file.fileUrl,
      fileName: "diagram.png",
    });
    expect(
      createItemSchema.safeParse({ ...VALID, typeName: "image", file: { ...file, fileUrl: "nope" } })
        .success,
    ).toBe(false);
  });

  it("requires a URL for links", () => {
    for (const url of [undefined, "  "]) {
      const result = createItemSchema.safeParse({ ...VALID, typeName: "link", url });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]).toMatchObject({ message: "URL is required", path: ["url"] });
    }
    expect(
      createItemSchema.safeParse({ ...VALID, typeName: "link", url: "https://ui.shadcn.com" }).success,
    ).toBe(true);
  });

  it("reports a missing URL together with other field errors", () => {
    const result = createItemSchema.safeParse({ ...VALID, typeName: "link", title: " ", url: "" });

    expect(result.error && z.flattenError(result.error).fieldErrors).toEqual({
      title: ["Title is required"],
      url: ["URL is required"],
    });
  });

  it("doesn't require a URL for other types", () => {
    expect(createItemSchema.safeParse({ ...VALID, typeName: "snippet" }).success).toBe(true);
  });
});
