import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createItemSchema, updateItemSchema } from "@/lib/validations/items";

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
});

describe("createItemSchema", () => {
  it("accepts the creatable types with the same field rules as editing", () => {
    const data = createItemSchema.parse({ ...VALID, typeName: "note", title: " Ideas ", content: "x" });
    expect(data).toMatchObject({ typeName: "note", title: "Ideas", content: "x" });
  });

  it("rejects file types and unknown types", () => {
    for (const typeName of ["file", "image", "recipe"]) {
      const result = createItemSchema.safeParse({ ...VALID, typeName });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Choose a type");
    }
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
