import { describe, expect, it } from "vitest";

import {
  FREE_PLAN_FEATURES,
  getProPlanPrice,
  getYearlySavingsPercent,
  YEARLY_SAVINGS_PERCENT,
} from "@/lib/home-content";

describe("getYearlySavingsPercent", () => {
  it("rounds the discount of the yearly price against twelve monthly payments", () => {
    expect(getYearlySavingsPercent(8, 72)).toBe(25);
    expect(getYearlySavingsPercent(10, 100)).toBe(17);
    expect(YEARLY_SAVINGS_PERCENT).toBe(25);
  });
});

describe("getProPlanPrice", () => {
  it("returns the monthly price", () => {
    expect(getProPlanPrice("monthly")).toEqual({
      price: "$8",
      period: "/month",
      note: "Billed monthly. Cancel anytime.",
    });
  });

  it("returns the yearly price with the monthly equivalent and the savings", () => {
    expect(getProPlanPrice("yearly")).toEqual({
      price: "$72",
      period: "/year",
      note: "Billed yearly. That's $6/month, 25% off.",
    });
  });
});

describe("FREE_PLAN_FEATURES", () => {
  it("lists the free plan limits", () => {
    expect(FREE_PLAN_FEATURES.slice(0, 2)).toEqual(["50 items", "3 collections"]);
  });
});
