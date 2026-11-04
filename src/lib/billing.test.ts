import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applySubscription,
  cancelSubscription,
  createCheckoutUrl,
  createPortalUrl,
  getBillingSummary,
  getOrCreateCustomer,
  syncSubscriptionById,
} from "@/lib/billing";
import { setStripeCustomerId, syncSubscription } from "@/lib/db/billing";
import { getPriceId, getStripe } from "@/lib/stripe";

vi.mock("@/lib/app-url", () => ({ getAppUrl: () => "https://app.test" }));
vi.mock("@/lib/db/billing", () => ({
  setStripeCustomerId: vi.fn(),
  syncSubscription: vi.fn(),
}));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn(), getPriceId: vi.fn() }));

const stripe = {
  customers: { create: vi.fn() },
  checkout: { sessions: { create: vi.fn() } },
  billingPortal: { sessions: { create: vi.fn() } },
  subscriptions: { retrieve: vi.fn(), cancel: vi.fn() },
};

const USER_ID = "user_1";
const CUSTOMER_ID = "cus_1";
const USER = {
  email: "dev@test.com",
  name: "Dev User",
  isPro: false,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

function subscription(status: Stripe.Subscription.Status, customer: unknown = CUSTOMER_ID) {
  return { id: "sub_1", status, customer } as Stripe.Subscription;
}

beforeEach(() => {
  vi.mocked(getStripe).mockReturnValue(stripe as never);
  vi.mocked(getPriceId).mockImplementation((billing) =>
    billing === "yearly" ? "price_yearly" : "price_monthly",
  );
  vi.mocked(syncSubscription).mockResolvedValue(true);
});

describe("getOrCreateCustomer", () => {
  it("reuses the saved customer", async () => {
    expect(await getOrCreateCustomer(USER_ID, { ...USER, stripeCustomerId: CUSTOMER_ID })).toBe(
      CUSTOMER_ID,
    );
    expect(stripe.customers.create).not.toHaveBeenCalled();
  });

  it("creates a customer with an idempotency key and saves its id", async () => {
    stripe.customers.create.mockResolvedValue({ id: "cus_new" });

    expect(await getOrCreateCustomer(USER_ID, USER)).toBe("cus_new");
    expect(stripe.customers.create).toHaveBeenCalledWith(
      { email: USER.email, name: USER.name, metadata: { userId: USER_ID } },
      { idempotencyKey: `customer-${USER_ID}` },
    );
    expect(setStripeCustomerId).toHaveBeenCalledWith(USER_ID, "cus_new");
  });

  it("leaves the name out when the user has none", async () => {
    stripe.customers.create.mockResolvedValue({ id: "cus_new" });

    await getOrCreateCustomer(USER_ID, { ...USER, name: null });
    expect(stripe.customers.create.mock.calls[0][0]).toMatchObject({ name: undefined });
  });
});

describe("createCheckoutUrl", () => {
  it.each([
    ["monthly", "price_monthly"],
    ["yearly", "price_yearly"],
  ] as const)("creates a %s subscription checkout", async (billing, price) => {
    stripe.checkout.sessions.create.mockResolvedValue({ url: "https://checkout.test/1" });

    expect(await createCheckoutUrl(USER_ID, CUSTOMER_ID, billing)).toBe("https://checkout.test/1");
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
      mode: "subscription",
      customer: CUSTOMER_ID,
      client_reference_id: USER_ID,
      line_items: [{ price, quantity: 1 }],
      subscription_data: { metadata: { userId: USER_ID } },
      allow_promotion_codes: true,
      success_url: "https://app.test/settings?checkout=success#billing",
      cancel_url: "https://app.test/settings?checkout=cancelled#billing",
    });
  });

  it("throws when the session has no URL", async () => {
    stripe.checkout.sessions.create.mockResolvedValue({ url: null });

    await expect(createCheckoutUrl(USER_ID, CUSTOMER_ID, "monthly")).rejects.toThrow(
      "Checkout session has no URL",
    );
  });
});

describe("createPortalUrl", () => {
  it("returns to the settings Billing card", async () => {
    stripe.billingPortal.sessions.create.mockResolvedValue({ url: "https://portal.test/1" });

    expect(await createPortalUrl(CUSTOMER_ID)).toBe("https://portal.test/1");
    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: CUSTOMER_ID,
      return_url: "https://app.test/settings#billing",
    });
  });
});

describe("applySubscription", () => {
  it.each(["active", "trialing", "past_due"] as const)("grants Pro for %s", async (status) => {
    await applySubscription(subscription(status));

    expect(syncSubscription).toHaveBeenCalledWith(CUSTOMER_ID, {
      isPro: true,
      stripeSubscriptionId: "sub_1",
    });
  });

  it("removes Pro but keeps the id for an unpaid subscription", async () => {
    await applySubscription(subscription("unpaid"));

    expect(syncSubscription).toHaveBeenCalledWith(CUSTOMER_ID, {
      isPro: false,
      stripeSubscriptionId: "sub_1",
    });
  });

  it("clears the subscription id when canceled", async () => {
    await applySubscription(subscription("canceled"));

    expect(syncSubscription).toHaveBeenCalledWith(CUSTOMER_ID, {
      isPro: false,
      stripeSubscriptionId: null,
    });
  });

  it("reads the customer id from an expanded customer", async () => {
    await applySubscription(subscription("active", { id: "cus_expanded" }));

    expect(syncSubscription).toHaveBeenCalledWith("cus_expanded", expect.anything());
  });

  it("warns about an unknown customer", async () => {
    vi.mocked(syncSubscription).mockResolvedValue(false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await applySubscription(subscription("active"));
    expect(warn).toHaveBeenCalledWith("Stripe subscription for an unknown customer", CUSTOMER_ID);
  });
});

describe("syncSubscriptionById", () => {
  it("applies the subscription's latest state from Stripe", async () => {
    stripe.subscriptions.retrieve.mockResolvedValue(subscription("canceled"));

    await syncSubscriptionById("sub_1");
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
    expect(syncSubscription).toHaveBeenCalledWith(CUSTOMER_ID, {
      isPro: false,
      stripeSubscriptionId: null,
    });
  });
});

describe("cancelSubscription", () => {
  it("cancels the subscription in Stripe", async () => {
    await cancelSubscription("sub_1");

    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith("sub_1");
  });
});

describe("getBillingSummary", () => {
  const PRO_USER = {
    ...USER,
    isPro: true,
    stripeCustomerId: CUSTOMER_ID,
    stripeSubscriptionId: "sub_1",
  };
  // 2026-12-05T00:00:00Z
  const PERIOD_END = 1796428800;

  function liveSubscription(fields: Record<string, unknown> = {}, interval = "month") {
    return {
      status: "active",
      cancel_at_period_end: false,
      cancel_at: null,
      items: { data: [{ current_period_end: PERIOD_END, price: { recurring: { interval } } }] },
      ...fields,
    };
  }

  it("uses the database flags without calling Stripe when there's no subscription", async () => {
    expect(await getBillingSummary({ ...USER, stripeCustomerId: CUSTOMER_ID })).toEqual({
      isPro: false,
      hasCustomer: true,
      interval: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      status: null,
    });
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });

  it.each([
    ["month", "month"],
    ["year", "year"],
  ] as const)("reads a %sly subscription's period from its item", async (interval, expected) => {
    stripe.subscriptions.retrieve.mockResolvedValue(liveSubscription({}, interval));

    expect(await getBillingSummary(PRO_USER)).toEqual({
      isPro: true,
      hasCustomer: true,
      interval: expected,
      currentPeriodEnd: "2026-12-05T00:00:00.000Z",
      cancelAtPeriodEnd: false,
      status: "active",
    });
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
  });

  it.each([
    ["cancel_at_period_end", { cancel_at_period_end: true }],
    ["cancel_at", { cancel_at: PERIOD_END }],
  ])("reports a pending cancellation from %s", async (_field, fields) => {
    stripe.subscriptions.retrieve.mockResolvedValue(liveSubscription(fields));

    expect((await getBillingSummary(PRO_USER)).cancelAtPeriodEnd).toBe(true);
  });

  it("reports a past_due status", async () => {
    stripe.subscriptions.retrieve.mockResolvedValue(liveSubscription({ status: "past_due" }));

    expect((await getBillingSummary(PRO_USER)).status).toBe("past_due");
  });

  it("falls back to the database flags when Stripe fails", async () => {
    stripe.subscriptions.retrieve.mockRejectedValue(new Error("Stripe down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await getBillingSummary(PRO_USER)).toEqual({
      isPro: true,
      hasCustomer: true,
      interval: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      status: null,
    });
  });
});
