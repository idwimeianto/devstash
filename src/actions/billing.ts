"use server";

import { redirect } from "next/navigation";

import { createCheckoutUrl, createPortalUrl, getOrCreateCustomer } from "@/lib/billing";
import { getUserBilling } from "@/lib/db/billing";
import { getSessionUserId } from "@/lib/db/users";
import { GENERIC_ERROR, NOT_SIGNED_IN } from "@/lib/messages";
import { isBillingOption } from "@/lib/usage-limits";
import type { BillingActionResult } from "@/types/billing";

const ALREADY_PRO = "You're already on Pro. Manage your plan from Billing.";
const NO_CUSTOMER = "There's no billing account yet. Upgrade to Pro first.";

// Redirects to Stripe Checkout; only failures return.
export async function startCheckout(billing: unknown): Promise<BillingActionResult> {
  if (!isBillingOption(billing)) return { success: false, error: GENERIC_ERROR };

  // Always the session's user, never one from the client.
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  let url: string;
  try {
    const user = await getUserBilling(userId);
    if (!user) return { success: false, error: NOT_SIGNED_IN };
    // One subscription per user; plan changes go through the portal.
    if (user.isPro || user.stripeSubscriptionId) return { success: false, error: ALREADY_PRO };

    const customerId = await getOrCreateCustomer(userId, user);
    url = await createCheckoutUrl(userId, customerId, billing);
  } catch (error) {
    console.error("Starting checkout failed", error);
    return { success: false, error: GENERIC_ERROR };
  }

  // Throws Next.js's redirect, so it stays outside the try.
  redirect(url);
}

// Redirects to the Stripe Customer Portal; only failures return.
export async function openBillingPortal(): Promise<BillingActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  let url: string;
  try {
    const user = await getUserBilling(userId);
    if (!user?.stripeCustomerId) return { success: false, error: NO_CUSTOMER };
    url = await createPortalUrl(user.stripeCustomerId);
  } catch (error) {
    console.error("Opening the billing portal failed", error);
    return { success: false, error: GENERIC_ERROR };
  }

  redirect(url);
}
