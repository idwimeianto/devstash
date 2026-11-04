import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { openBillingPortal, startCheckout } from "@/actions/billing";
import { createCheckoutUrl, createPortalUrl, getOrCreateCustomer } from "@/lib/billing";
import { getUserBilling } from "@/lib/db/billing";
import { getSessionUserId } from "@/lib/db/users";
import { GENERIC_ERROR, NOT_SIGNED_IN } from "@/lib/messages";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/billing", () => ({
  createCheckoutUrl: vi.fn(),
  createPortalUrl: vi.fn(),
  getOrCreateCustomer: vi.fn(),
}));
vi.mock("@/lib/db/billing", () => ({ getUserBilling: vi.fn() }));
vi.mock("@/lib/db/users", () => ({ getSessionUserId: vi.fn() }));

const USER_ID = "user_1";
const FREE_USER = {
  email: "dev@test.com",
  name: "Dev User",
  isPro: false,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

beforeEach(() => {
  vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
  vi.mocked(getUserBilling).mockResolvedValue(FREE_USER);
});

describe("startCheckout", () => {
  it("redirects to Stripe Checkout for the chosen billing period", async () => {
    vi.mocked(getOrCreateCustomer).mockResolvedValue("cus_1");
    vi.mocked(createCheckoutUrl).mockResolvedValue("https://checkout.test/1");

    await startCheckout("yearly");
    expect(getOrCreateCustomer).toHaveBeenCalledWith(USER_ID, FREE_USER);
    expect(createCheckoutUrl).toHaveBeenCalledWith(USER_ID, "cus_1", "yearly");
    expect(redirect).toHaveBeenCalledWith("https://checkout.test/1");
  });

  it.each(["weekly", "", null, 12])("rejects the billing period %j", async (billing) => {
    expect(await startCheckout(billing)).toEqual({ success: false, error: GENERIC_ERROR });
    expect(getSessionUserId).not.toHaveBeenCalled();
  });

  it("refuses when signed out", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    expect(await startCheckout("monthly")).toEqual({ success: false, error: NOT_SIGNED_IN });
  });

  it("refuses when the account no longer exists", async () => {
    vi.mocked(getUserBilling).mockResolvedValue(null);

    expect(await startCheckout("monthly")).toEqual({ success: false, error: NOT_SIGNED_IN });
  });

  it.each([
    ["already Pro", { isPro: true }],
    ["has a subscription", { stripeSubscriptionId: "sub_1" }],
  ])("refuses a second subscription when the user %s", async (_case, fields) => {
    vi.mocked(getUserBilling).mockResolvedValue({ ...FREE_USER, ...fields });

    const result = await startCheckout("monthly");
    expect(result).toEqual({ success: false, error: expect.stringContaining("already on Pro") });
    expect(getOrCreateCustomer).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns a generic error when Stripe fails", async () => {
    vi.mocked(getOrCreateCustomer).mockRejectedValue(new Error("Stripe down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await startCheckout("monthly")).toEqual({ success: false, error: GENERIC_ERROR });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("openBillingPortal", () => {
  it("redirects to the Customer Portal", async () => {
    vi.mocked(getUserBilling).mockResolvedValue({ ...FREE_USER, stripeCustomerId: "cus_1" });
    vi.mocked(createPortalUrl).mockResolvedValue("https://portal.test/1");

    await openBillingPortal();
    expect(createPortalUrl).toHaveBeenCalledWith("cus_1");
    expect(redirect).toHaveBeenCalledWith("https://portal.test/1");
  });

  it("refuses when signed out", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    expect(await openBillingPortal()).toEqual({ success: false, error: NOT_SIGNED_IN });
  });

  it("refuses without a Stripe customer", async () => {
    const result = await openBillingPortal();
    expect(result).toEqual({ success: false, error: expect.stringContaining("no billing account") });
    expect(createPortalUrl).not.toHaveBeenCalled();
  });

  it("returns a generic error when Stripe fails", async () => {
    vi.mocked(getUserBilling).mockResolvedValue({ ...FREE_USER, stripeCustomerId: "cus_1" });
    vi.mocked(createPortalUrl).mockRejectedValue(new Error("Stripe down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await openBillingPortal()).toEqual({ success: false, error: GENERIC_ERROR });
    expect(redirect).not.toHaveBeenCalled();
  });
});
