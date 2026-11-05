import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  canCreateCollection,
  canCreateItem,
  canUse,
  COLLECTION_LIMIT_REACHED,
  FREE_COLLECTION_LIMIT,
  FREE_ITEM_LIMIT,
  isBillingOption,
  isProGatingEnabled,
  isProStatus,
  ITEM_LIMIT_REACHED,
  type ProFeature,
} from "@/lib/usage-limits";

const FREE = { isPro: false };
const PRO = { isPro: true };
const FEATURES: ProFeature[] = ["uploads", "customTypes", "ai", "export"];

function enableGating() {
  vi.stubEnv("PRO_GATING_ENABLED", "true");
}

// Stubbed in every test so a value in the shell or .env can't leak in.
beforeEach(() => {
  vi.stubEnv("PRO_GATING_ENABLED", "false");
});

describe("isProStatus", () => {
  it.each(["active", "trialing", "past_due"])("keeps Pro for %s", (status) => {
    expect(isProStatus(status)).toBe(true);
  });

  it.each(["incomplete", "incomplete_expired", "unpaid", "canceled", "paused", "something_new"])(
    "drops Pro for %s",
    (status) => {
      expect(isProStatus(status)).toBe(false);
    },
  );
});

describe("isProGatingEnabled", () => {
  it('is off only for exactly "false"', () => {
    expect(isProGatingEnabled()).toBe(false);
  });

  it.each(["true", "", "FALSE", "0", "no"])("is on for %j", (value) => {
    vi.stubEnv("PRO_GATING_ENABLED", value);
    expect(isProGatingEnabled()).toBe(true);
  });

  it("is on when the variable is missing", () => {
    vi.stubEnv("PRO_GATING_ENABLED", undefined);
    expect(isProGatingEnabled()).toBe(true);
  });
});

describe("canUse", () => {
  it("allows every feature for everyone while gating is off", () => {
    for (const feature of FEATURES) {
      expect(canUse(feature, FREE)).toBe(true);
      expect(canUse(feature, PRO)).toBe(true);
    }
  });

  it("allows every feature only for Pro users while gating is on", () => {
    enableGating();
    for (const feature of FEATURES) {
      expect(canUse(feature, FREE)).toBe(false);
      expect(canUse(feature, PRO)).toBe(true);
    }
  });
});

describe("canCreateItem", () => {
  it("ignores the limit while gating is off", () => {
    expect(canCreateItem(FREE, FREE_ITEM_LIMIT + 100)).toBe(true);
  });

  it("allows free users up to the limit while gating is on", () => {
    enableGating();
    expect(FREE_ITEM_LIMIT).toBe(50);
    expect(canCreateItem(FREE, 0)).toBe(true);
    expect(canCreateItem(FREE, 49)).toBe(true);
    expect(canCreateItem(FREE, 50)).toBe(false);
    expect(canCreateItem(FREE, 51)).toBe(false);
  });

  it("never limits Pro users", () => {
    enableGating();
    expect(canCreateItem(PRO, 1000)).toBe(true);
  });
});

describe("canCreateCollection", () => {
  it("ignores the limit while gating is off", () => {
    expect(canCreateCollection(FREE, FREE_COLLECTION_LIMIT + 10)).toBe(true);
  });

  it("allows free users up to the limit while gating is on", () => {
    enableGating();
    expect(FREE_COLLECTION_LIMIT).toBe(3);
    expect(canCreateCollection(FREE, 2)).toBe(true);
    expect(canCreateCollection(FREE, 3)).toBe(false);
    expect(canCreateCollection(FREE, 4)).toBe(false);
  });

  it("never limits Pro users", () => {
    enableGating();
    expect(canCreateCollection(PRO, 100)).toBe(true);
  });
});

describe("isBillingOption", () => {
  it.each(["monthly", "yearly"])("accepts %s", (value) => {
    expect(isBillingOption(value)).toBe(true);
  });

  it.each(["weekly", "", "Monthly", null, 1])("rejects %j", (value) => {
    expect(isBillingOption(value)).toBe(false);
  });
});

describe("limit messages", () => {
  it("mention the limits", () => {
    expect(ITEM_LIMIT_REACHED).toContain("50 items");
    expect(COLLECTION_LIMIT_REACHED).toContain("3 collections");
  });
});
