import { describe, expect, it } from "vitest";
import { z } from "zod";

import { validationFailure } from "@/lib/action-result";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.url("Enter a valid URL"),
});

describe("validationFailure", () => {
  it("returns the first issue as the message and every field's errors", () => {
    const result = schema.safeParse({ title: "", url: "nope" });

    expect(result.error && validationFailure(result.error)).toEqual({
      success: false,
      error: "Title is required",
      fieldErrors: { title: ["Title is required"], url: ["Enter a valid URL"] },
    });
  });
});
