import type Stripe from "stripe";

import { jsonError } from "@/lib/api-response";
import { syncSubscriptionById } from "@/lib/billing";
import { getStripe, getWebhookSecret } from "@/lib/stripe";

// Every handled event re-fetches its subscription and writes the current state, so repeated or
// out-of-order deliveries end up the same and no processed-events table is needed.
async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && typeof session.subscription === "string") {
        await syncSubscriptionById(session.subscription);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscriptionById(event.data.object.id);
      break;
    default:
      break;
  }
}

// Called by Stripe, not a browser: there's no session and the signature is the authentication.
// The proxy doesn't cover /api, so nothing redirects it to sign in.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return jsonError("Missing signature", 400);

  let secret: string;
  try {
    secret = getWebhookSecret();
  } catch (error) {
    console.error("Stripe webhook secret is missing", error);
    return jsonError("Webhook not configured", 500);
  }

  let event: Stripe.Event;
  try {
    // The raw body exactly as sent; a parsed and re-serialized body fails the check.
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature check failed", error);
    return jsonError("Invalid signature", 400);
  }

  try {
    await handleEvent(event);
  } catch (error) {
    // A 5xx makes Stripe retry the event later.
    console.error(`Handling Stripe event ${event.type} failed`, error);
    return jsonError("Webhook handling failed", 500);
  }

  return Response.json({ received: true });
}
