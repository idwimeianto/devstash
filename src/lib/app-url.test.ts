import { describe, expect, it, vi } from "vitest";

import { getAppUrl } from "@/lib/app-url";

describe("getAppUrl", () => {
  it("returns NEXT_PUBLIC_APP_URL without a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://devstash.test/");

    expect(getAppUrl()).toBe("https://devstash.test");
  });

  it("ignores the old APP_URL name", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("APP_URL", "https://old.test");
    vi.stubEnv("NODE_ENV", "development");

    expect(getAppUrl()).toBe("http://localhost:3000");
  });

  it("falls back to localhost outside production when empty", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NODE_ENV", "development");

    expect(getAppUrl()).toBe("http://localhost:3000");
  });

  it("throws in production when it isn't set", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getAppUrl()).toThrow("NEXT_PUBLIC_APP_URL is not set");
  });
});
