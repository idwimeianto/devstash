import type Stripe from "stripe";

import { getAppUrl } from "@/lib/app-url";
import { setStripeCustomerId, syncSubscription } from "@/lib/db/billing";
import { getPriceId, getStripe } from "@/lib/stripe";
import { isProStatus, type Billing } from "@/lib/usage-limits";
import type { UserBilling } from "@/types/billing";

// Reuses the saved customer; the idempotency key keeps a retried first call from creating two.
export async function getOrCreateCustomer(userId: string, user: UserBilling): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await getStripe().customers.create(
    { email: user.email, name: user.name ?? undefined, metadata: { userId } },
    { idempotencyKey: `customer-${userId}` },
  );
  await setStripeCustomerId(userId, customer.id);
  return customer.id;
}

// Return URLs come from APP_URL, never the request's Host header.
export async function createCheckoutUrl(
  userId: string,
  customerId: string,
  billing: Billing,
): Promise<string> {
  const appUrl = getAppUrl();
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: userId,
    line_items: [{ price: getPriceId(billing), quantity: 1 }],
    subscription_data: { metadata: { userId } },
    allow_promotion_codes: true,
    success_url: `${appUrl}/settings?checkout=success#billing`,
    cancel_url: `${appUrl}/settings?checkout=cancelled#billing`,
  });
  if (!session.url) throw new Error("Checkout session has no URL");
  return session.url;
}

export async function createPortalUrl(customerId: string): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getAppUrl()}/settings#billing`,
  });
  return session.url;
}

// Writes the subscription's current state, so it's safe for any event, in any order, any number of times.
export async function applySubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const found = await syncSubscription(customerId, {
    isPro: isProStatus(subscription.status),
    stripeSubscriptionId: subscription.status === "canceled" ? null : subscription.id,
  });
  if (!found) console.warn("Stripe subscription for an unknown customer", customerId);
}

// Always the latest state from Stripe, never a possibly older event payload.
export async function syncSubscriptionById(subscriptionId: string): Promise<void> {
  await applySubscription(await getStripe().subscriptions.retrieve(subscriptionId));
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await getStripe().subscriptions.cancel(subscriptionId);
}
