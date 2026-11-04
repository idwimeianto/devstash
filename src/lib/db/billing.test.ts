import { describe, expect, it, vi } from "vitest";

import {
  countUserCollections,
  countUserItems,
  getUserBilling,
  getUserPlan,
  setStripeCustomerId,
  syncSubscription,
} from "@/lib/db/billing";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    item: { count: vi.fn() },
    collection: { count: vi.fn() },
  },
}));

const USER_ID = "user_1";
const CUSTOMER_ID = "cus_1";

describe("getUserPlan", () => {
  it("reads isPro from the database", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ isPro: true } as never);

    expect(await getUserPlan(USER_ID)).toEqual({ isPro: true });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: USER_ID },
      select: { isPro: true },
    });
  });

  it("returns free for a free user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ isPro: false } as never);

    expect(await getUserPlan(USER_ID)).toEqual({ isPro: false });
  });

  it("treats a missing user as free", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    expect(await getUserPlan(USER_ID)).toEqual({ isPro: false });
  });
});

describe("getUserBilling", () => {
  it("selects only the billing fields", async () => {
    const billing = {
      email: "a@b.c",
      name: null,
      isPro: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(billing as never);

    expect(await getUserBilling(USER_ID)).toEqual(billing);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: USER_ID },
      select: {
        email: true,
        name: true,
        isPro: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });
  });
});

describe("setStripeCustomerId", () => {
  it("saves the customer id on the user", async () => {
    await setStripeCustomerId(USER_ID, CUSTOMER_ID);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { stripeCustomerId: CUSTOMER_ID },
    });
  });
});

describe("syncSubscription", () => {
  const state = { isPro: true, stripeSubscriptionId: "sub_1" };

  it("updates the user with the customer id", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 });

    expect(await syncSubscription(CUSTOMER_ID, state)).toBe(true);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: CUSTOMER_ID },
      data: state,
    });
  });

  it("returns false when no user has the customer id", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 0 });

    expect(await syncSubscription(CUSTOMER_ID, state)).toBe(false);
  });
});

describe("usage counts", () => {
  it("count the user's items and collections", async () => {
    vi.mocked(prisma.item.count).mockResolvedValue(12);
    vi.mocked(prisma.collection.count).mockResolvedValue(2);

    expect(await countUserItems(USER_ID)).toBe(12);
    expect(await countUserCollections(USER_ID)).toBe(2);
    expect(prisma.item.count).toHaveBeenCalledWith({ where: { userId: USER_ID } });
    expect(prisma.collection.count).toHaveBeenCalledWith({ where: { userId: USER_ID } });
  });
});
