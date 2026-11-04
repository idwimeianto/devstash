import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/webhooks/stripe/route";
import { syncSubscriptionById } from "@/lib/billing";
import { getStripe, getWebhookSecret } from "@/lib/stripe";

vi.mock("@/lib/billing", () => ({ syncSubscriptionById: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn(), getWebhookSecret: vi.fn() }));

const SECRET = "whsec_test_secret";
// A real client only for signing and verifying locally; it never makes a request.
const stripe = new Stripe("sk_test_unused");

function event(type: string, object: Record<string, unknown>) {
  return { id: "evt_1", object: "event", type, data: { object } };
}

function signedRequest(payload: object, secret = SECRET) {
  const body = JSON.stringify(payload);
  const signature = stripe.webhooks.generateTestHeaderString({ payload: body, secret });
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body,
  });
}

beforeEach(() => {
  vi.mocked(getStripe).mockReturnValue(stripe);
  vi.mocked(getWebhookSecret).mockReturnValue(SECRET);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/webhooks/stripe", () => {
  it("syncs the subscription of a completed subscription checkout", async () => {
    const response = await POST(
      signedRequest(
        event("checkout.session.completed", { mode: "subscription", subscription: "sub_1" }),
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(syncSubscriptionById).toHaveBeenCalledWith("sub_1");
  });

  it("ignores a checkout that isn't a subscription", async () => {
    const response = await POST(
      signedRequest(event("checkout.session.completed", { mode: "payment", subscription: null })),
    );

    expect(response.status).toBe(200);
    expect(syncSubscriptionById).not.toHaveBeenCalled();
  });

  it.each([
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ])("syncs the subscription on %s", async (type) => {
    const response = await POST(signedRequest(event(type, { id: "sub_2" })));

    expect(response.status).toBe(200);
    expect(syncSubscriptionById).toHaveBeenCalledWith("sub_2");
  });

  it("acknowledges event types it doesn't handle", async () => {
    const response = await POST(signedRequest(event("invoice.paid", { id: "in_1" })));

    expect(response.status).toBe(200);
    expect(syncSubscriptionById).not.toHaveBeenCalled();
  });

  it("returns 400 without a signature", async () => {
    const response = await POST(
      new Request("http://localhost/api/webhooks/stripe", { method: "POST", body: "{}" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ success: false, error: "Missing signature" });
  });

  it("returns 400 for a signature made with another secret", async () => {
    const response = await POST(
      signedRequest(event("customer.subscription.updated", { id: "sub_2" }), "whsec_other"),
    );

    expect(response.status).toBe(400);
    expect(syncSubscriptionById).not.toHaveBeenCalled();
  });

  it("returns 400 when the body was changed after signing", async () => {
    const signed = signedRequest(event("customer.subscription.updated", { id: "sub_2" }));
    const tampered = new Request(signed.url, {
      method: "POST",
      headers: signed.headers,
      body: JSON.stringify(event("customer.subscription.updated", { id: "sub_evil" })),
    });

    const response = await POST(tampered);
    expect(response.status).toBe(400);
    expect(syncSubscriptionById).not.toHaveBeenCalled();
  });

  it("returns 500 when the webhook secret isn't configured", async () => {
    vi.mocked(getWebhookSecret).mockImplementation(() => {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    });

    const response = await POST(signedRequest(event("customer.subscription.updated", {})));
    expect(response.status).toBe(500);
  });

  it("returns 500 so Stripe retries when handling fails", async () => {
    vi.mocked(syncSubscriptionById).mockRejectedValue(new Error("database down"));

    const response = await POST(signedRequest(event("customer.subscription.updated", { id: "sub_2" })));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Webhook handling failed",
    });
  });
});
