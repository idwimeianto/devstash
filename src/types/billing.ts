export interface UserBilling {
  email: string;
  name: string | null;
  isPro: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface SubscriptionState {
  isPro: boolean;
  stripeSubscriptionId: string | null;
}

// Successful billing actions redirect to Stripe, so only failures come back.
export type BillingActionResult = { success: false; error: string };

// What the settings Billing card shows (filled in Phase 2).
export interface BillingSummary {
  isPro: boolean;
  hasCustomer: boolean;
  interval: "month" | "year" | null;
  currentPeriodEnd: string | null; // ISO
  cancelAtPeriodEnd: boolean;
  status: string | null;
}
