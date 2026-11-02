import { describe, expect, it } from "vitest";

import { getSafeHref } from "@/lib/safe-url";

describe("getSafeHref", () => {
  it("keeps http and https URLs", () => {
    expect(getSafeHref("https://ui.shadcn.com/docs")).toBe("https://ui.shadcn.com/docs");
    expect(getSafeHref("http://localhost:3000/")).toBe("http://localhost:3000/");
  });

  it("rejects script and data URLs", () => {
    expect(getSafeHref("javascript:alert(1)")).toBeNull();
    expect(getSafeHref("JavaScript:alert(1)")).toBeNull();
    expect(getSafeHref("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("rejects values that aren't absolute URLs", () => {
    expect(getSafeHref("ui.shadcn.com")).toBeNull();
    expect(getSafeHref("")).toBeNull();
  });
});
