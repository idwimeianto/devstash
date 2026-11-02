import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getClientIp, getRateLimitMessage, getRetryAfterSeconds } from "@/lib/rate-limit";

const NOW = new Date("2026-01-01T00:00:00Z").getTime();

describe("getClientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    const headers = new Headers({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1", "x-real-ip": "10.0.0.2" });
    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "10.0.0.2" }))).toBe("10.0.0.2");
  });

  it('returns "unknown" without either header', () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("retry helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rounds the retry delay up to whole seconds", () => {
    expect(getRetryAfterSeconds(NOW + 1500)).toBe(2);
  });

  it("never returns less than one second", () => {
    expect(getRetryAfterSeconds(NOW - 5000)).toBe(1);
  });

  it("uses the singular for one minute", () => {
    expect(getRateLimitMessage(NOW + 30_000)).toBe(
      "Too many attempts. Please try again in 1 minute.",
    );
  });

  it("rounds up to whole minutes", () => {
    expect(getRateLimitMessage(NOW + 14 * 60_000 + 1000)).toBe(
      "Too many attempts. Please try again in 15 minutes.",
    );
  });
});

describe("checkRateLimit", () => {
  it("allows the request when Upstash is not configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.resetModules();
    // Imported fresh because the Redis client is created when the module loads.
    const { checkRateLimit } = await import("@/lib/rate-limit");

    await expect(checkRateLimit("login", "203.0.113.7")).resolves.toEqual({
      success: true,
      remaining: 5,
      reset: 0,
    });
  });
});
