# Stripe Integration Phase 1 — Core Infrastructure

## Overview

Lay the foundation for DevStash Pro ($8/month or $72/year) without changing anything users see: the Stripe client, a usage-limits module (free-plan limits, Pro features, the gating switch), billing queries and helpers, Checkout / Portal server actions, and `isPro` in the session. Everything is covered by unit tests with Stripe and Prisma mocked; no webhook, UI or Stripe CLI yet (that's Phase 2, `stripe-phase-2-spec.md`).

Reference: `docs/stripe-integration-plan.md` (§5 Files to Create, §6 Files to Modify).

## Requirements

- Install `stripe` (latest stable; don't pass `apiVersion`, so the SDK's pinned version matches its types)
- Create `src/lib/stripe.ts` (lazy client, env readers)
- Create `src/lib/usage-limits.ts` (limits, prices, Pro features, gating switch) with unit tests
- Move the pricing constants out of `src/lib/home-content.ts` into `usage-limits.ts`, re-exported so the homepage and its tests don't change
- Create `src/lib/db/billing.ts` (billing queries) and `src/lib/billing.ts` (Stripe-side helpers)
- Create `src/actions/billing.ts` (`startCheckout`, `openBillingPortal`)
- Create `src/types/billing.ts`
- Add `isPro` to the session, synced from the database on every validation
- No migration: `User.isPro`, `stripeCustomerId` and `stripeSubscriptionId` already exist
- With `PRO_GATING_ENABLED` unset, no user-visible behavior changes

## Stripe Client — `src/lib/stripe.ts`

Server only. Follows `src/lib/r2.ts`: created on first use, env read lazily so builds and tests don't need it.

- `getStripe()` — `client ??= new Stripe(requireEnv("STRIPE_SECRET_KEY"))`
- `getWebhookSecret()` — `STRIPE_WEBHOOK_SECRET` (used in Phase 2)
- `getPriceId(billing)` — `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`
- Missing variables throw `"<NAME> is not set"`

## Usage Limits — `src/lib/usage-limits.ts`

Pure and client-safe: no Prisma, no Stripe import.

| Export | Value / behavior |
| --- | --- |
| `FREE_ITEM_LIMIT` | `50` |
| `FREE_COLLECTION_LIMIT` | `3` |
| `PRO_MONTHLY_PRICE` / `PRO_YEARLY_PRICE` | `8` / `72` |
| `BILLING_OPTIONS` | `["monthly", "yearly"]`, plus `isBillingOption()` type guard |
| `ProFeature` | `"uploads" \| "customTypes" \| "ai" \| "export"` |
| `isProStatus(status)` | `true` for `active`, `trialing`, `past_due`; `false` for `incomplete`, `incomplete_expired`, `unpaid`, `canceled`, `paused` and anything unknown |
| `isProGatingEnabled()` | `true` only when `PRO_GATING_ENABLED` is exactly `"true"` (everything stays open during development) |
| `canUse(feature, user)` | `!isProGatingEnabled() \|\| user.isPro` |
| `canCreateItem(user, itemCount)` | open when gating is off or Pro; otherwise `itemCount < FREE_ITEM_LIMIT` |
| `canCreateCollection(user, collectionCount)` | same with `FREE_COLLECTION_LIMIT` |
| `ITEM_LIMIT_REACHED`, `COLLECTION_LIMIT_REACHED`, `PRO_FEATURE_REQUIRED` | user-facing messages built from the constants |

Notes:

- `PRO_GATING_ENABLED` isn't `NEXT_PUBLIC_`, so in the browser `isProGatingEnabled()` is always `false`. Client components get computed results (e.g. `canUpload`) as props from server components in Phase 2.
- `Billing` stays exported from `home-content.ts` (or moves here and is re-exported); `getProPlanPrice()`, `getYearlySavingsPercent()` and the plan feature lists stay in `home-content.ts`, importing the constants.
- Read the gating switch in one place only, like `isEmailVerificationEnabled()` in `src/lib/email-verification.ts`.

## Billing Queries — `src/lib/db/billing.ts`

- `getUserPlan(userId)` — `cache()`d per request, `{ isPro }` from the database (enforcement never trusts the JWT); `false` for a missing user
- `getUserBilling(userId)` — `email`, `name`, `isPro`, `stripeCustomerId`, `stripeSubscriptionId` or `null`
- `setStripeCustomerId(userId, customerId)`
- `syncSubscription(customerId, { isPro, stripeSubscriptionId })` — `updateMany` by `stripeCustomerId`, returns `false` when no user matched
- `countUserItems(userId)` / `countUserCollections(userId)` — one `count` each

## Billing Helpers — `src/lib/billing.ts`

Server only.

- `getOrCreateCustomer(userId, user)` — reuses `stripeCustomerId`, otherwise `customers.create` with `email`, `name`, `metadata.userId` and `idempotencyKey: customer-<userId>`, then saves the id
- `createCheckoutUrl(userId, customerId, billing)` — `mode: "subscription"`, `customer`, `client_reference_id: userId`, the price for `billing`, `subscription_data.metadata.userId`, `allow_promotion_codes: true`, `success_url` `${getAppUrl()}/settings?checkout=success#billing`, `cancel_url` `…?checkout=cancelled#billing`; throws when the session has no `url`
- `createPortalUrl(customerId)` — `billingPortal.sessions.create` with `return_url` `${getAppUrl()}/settings#billing`
- `applySubscription(subscription)` — customer id from the string or object, `isPro` from `isProStatus(status)`, `stripeSubscriptionId` `null` when `canceled`; logs a warning for an unknown customer
- `syncSubscriptionById(subscriptionId)` — `subscriptions.retrieve` then `applySubscription` (always the latest state, so events can repeat or arrive out of order)
- `cancelSubscription(subscriptionId)` — `subscriptions.cancel` (used by account deletion in Phase 2)

URLs always come from `getAppUrl()`, never the request's Host header.

## Server Actions — `src/actions/billing.ts`

Follow the existing action pattern (validate → `getSessionUserId()` → `try/catch` with `GENERIC_ERROR`, `redirect()` outside the `try`).

`startCheckout(billing)`
- Invalid `billing` → `GENERIC_ERROR`
- Signed out or missing user → `NOT_SIGNED_IN`
- Already Pro or already has a `stripeSubscriptionId` → "You're already on Pro. Manage your plan from Billing." (one subscription per user; plan changes go through the portal)
- Gets or creates the customer, creates the Checkout session, then `redirect(url)`

`openBillingPortal()`
- Signed out → `NOT_SIGNED_IN`
- No `stripeCustomerId` → "There's no billing account yet. Upgrade to Pro first."
- Creates the portal session, then `redirect(url)`

Both return `BillingActionResult` (`{ success: false, error }`) only on failure; success redirects. Nothing calls them until Phase 2's Billing card.

## Types — `src/types/billing.ts`

- `UserBilling` — the `getUserBilling()` shape
- `BillingActionResult` — `{ success: false; error: string }`
- `BillingSummary` — `isPro`, `hasCustomer`, `interval` (`"month" | "year" | null`), `currentPeriodEnd` (ISO or `null`), `cancelAtPeriodEnd`, `status` (filled in Phase 2)

## Session `isPro`

- `src/types/next-auth.d.ts` — add `isPro: boolean` to `Session["user"]` and `id?` / `isPro?` to the `JWT` interface (check which module the installed `next-auth` beta resolves `JWT` from: `next-auth/jwt` or `@auth/core/jwt`)
- `src/auth.config.ts` — `session` callback sets `session.user.isPro = token.isPro === true` (no database access here; the proxy uses this file)
- `src/auth.ts` — override `callbacks.jwt`: run `authConfig.callbacks.jwt(params)`, then, when `token.id` is a string, read `isPro` from the database and set `token.isPro` (`false` for a missing user)

### Why not `trigger === "update"`

The NextAuth v5 docs suggest refreshing the session with `trigger === "update"` after calling `update()` from `useSession()`. That doesn't reliably work when a Stripe webhook changes `isPro` in the database. Instead, the `jwt` callback re-reads `isPro` on every session validation, so a plain reload after checkout picks up Pro.

Adapted from the research notes: this codebase stores the user id in `token.id`, not `token.sub`, and the lookup lives in `auth.ts` so the proxy stays free of Prisma. Cost: one primary-key query per `auth()` call, at most once per request since `getSessionUserId()` is `cache()`d.

## Environment Variables

Already in `.env` (values set by the user): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`, `STRIPE_PUBLISHABLE_KEY` (unused with hosted Checkout).

Add to `.env`:

```
PRO_GATING_ENABLED=false
```

## Testing

Unit tests next to their files; Stripe, Prisma, `@/auth` and `next/navigation` mocked with `vi.mock` (never hit Stripe).

1. **`src/lib/usage-limits.test.ts`** (required)
   - `isProStatus`: each Pro status `true`; `incomplete`, `incomplete_expired`, `unpaid`, `canceled`, `paused` and an unknown string `false`
   - `isProGatingEnabled`: unset, `"false"`, `"TRUE"`, `"1"` → `false`; `"true"` → `true` (`vi.stubEnv`)
   - `canUse`: gating off → `true` for free and Pro; gating on → `true` for Pro, `false` for free, for every `ProFeature`
   - `canCreateItem`: gating off → `true` even over the limit; gating on, free → `true` at 0 and 49, `false` at 50 and 51; Pro → `true` at 1,000
   - `canCreateCollection`: same boundaries at 2 / 3 / 4
   - `isBillingOption`: `"monthly"`, `"yearly"` → `true`; `"weekly"`, `""` → `false`
   - Messages mention the limits (`50 items`, `3 collections`)
2. **`src/lib/home-content.test.ts`** — existing tests still pass unchanged after the constants move
3. **`src/lib/db/billing.test.ts`** — `getUserPlan` (Pro, free, missing user), `syncSubscription` returning `true` / `false` from the count
4. **`src/lib/billing.test.ts`** — `getOrCreateCustomer` reuse vs create + save; Checkout params per billing (price id, mode, `client_reference_id`, URLs from `getAppUrl`); missing session `url` throws; `applySubscription` for `active`, `past_due`, `canceled` (id `null`), customer as object, unknown customer warning; `syncSubscriptionById` retrieves then applies
5. **`src/actions/billing.test.ts`** — `startCheckout`: invalid billing, signed out, already Pro, existing subscription id, Stripe failure → `GENERIC_ERROR`, success calls `redirect` with the URL; `openBillingPortal`: signed out, no customer, failure, success
6. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` pass
7. In the browser: sign in, the dashboard and `/settings` still work; with consent, set `isPro = true` for the demo user on the **dev branch**, reload, and confirm `session.user.isPro` is `true` (e.g. a temporary log or `/api/auth/session`), then set it back

## Out of Scope (Phase 2)

- `POST /api/webhooks/stripe` and Stripe CLI testing
- Enforcing limits in `createItem`, `createCollection` and `POST /api/upload`
- Billing card on `/settings`, homepage pricing buttons, upgrade hints in the UI
- Canceling the subscription on account deletion
- Stripe Dashboard setup (product, prices, portal, webhook endpoint)

## References

- Plan: `docs/stripe-integration-plan.md`
- Stripe Node SDK: https://github.com/stripe/stripe-node
- Checkout subscriptions: https://docs.stripe.com/billing/quickstart
- Customer portal: https://docs.stripe.com/customer-management/integrate-customer-portal
- Auth.js callbacks: https://authjs.dev/reference/nextjs#callbacks
