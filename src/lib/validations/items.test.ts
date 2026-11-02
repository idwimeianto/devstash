import { describe, expect, it } from "vitest";

import { updateItemSchema } from "@/lib/validations/items";

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
