// Free-plan limits, Pro features and the gating switch. Pure, so client code can import it too.

export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;
export const PRO_MONTHLY_PRICE = 8;
export const PRO_YEARLY_PRICE = 72;

export const BILLING_OPTIONS = ["monthly", "yearly"] as const;

export type Billing = (typeof BILLING_OPTIONS)[number];

export function isBillingOption(value: unknown): value is Billing {
  return (BILLING_OPTIONS as readonly unknown[]).includes(value);
}

export type ProFeature = "uploads" | "customTypes" | "ai" | "export";

export interface PlanUser {
  isPro: boolean;
}

// Subscription statuses that keep Pro; past_due keeps it while Stripe retries the card.
const PRO_STATUSES = new Set(["active", "trialing", "past_due"]);

export function isProStatus(status: string): boolean {
  return PRO_STATUSES.has(status);
}

// Off unless exactly "true", so every user can use everything during development.
// Not a NEXT_PUBLIC_ variable: in the browser this is always false.
export function isProGatingEnabled(): boolean {
  return process.env.PRO_GATING_ENABLED === "true";
}

// Pro users, and everyone while gating is off, have no limits.
function hasFullAccess(user: PlanUser): boolean {
  return !isProGatingEnabled() || user.isPro;
}

// Every Pro feature is gated the same way for now; the feature names the call site.
export function canUse(_feature: ProFeature, user: PlanUser): boolean {
  return hasFullAccess(user);
}

export function canCreateItem(user: PlanUser, itemCount: number): boolean {
  return hasFullAccess(user) || itemCount < FREE_ITEM_LIMIT;
}

export function canCreateCollection(user: PlanUser, collectionCount: number): boolean {
  return hasFullAccess(user) || collectionCount < FREE_COLLECTION_LIMIT;
}

export const ITEM_LIMIT_REACHED = `The free plan includes ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`;
export const COLLECTION_LIMIT_REACHED = `The free plan includes ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections.`;
export const PRO_FEATURE_REQUIRED = "File and image uploads are a Pro feature. Upgrade to Pro to use them.";
