import { describe, expect, it } from "vitest";

import { isNavLinkActive } from "@/lib/sidebar-nav";

describe("isNavLinkActive", () => {
  it("matches the link's own page, ignoring a trailing slash", () => {
    expect(isNavLinkActive("/items/snippets", "/items/snippets")).toBe(true);
    expect(isNavLinkActive("/items/snippets/", "/items/snippets")).toBe(true);
  });

  it("doesn't match other pages", () => {
    expect(isNavLinkActive("/items/prompts", "/items/snippets")).toBe(false);
  });

  it("doesn't light up the parent list on a detail page", () => {
    expect(isNavLinkActive("/collections/abc", "/collections")).toBe(false);
    expect(isNavLinkActive("/collections/abc", "/collections/abc")).toBe(true);
  });

  it("doesn't match a path that only starts the same", () => {
    expect(isNavLinkActive("/collections-old", "/collections")).toBe(false);
  });
});
