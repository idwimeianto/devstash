# Stripe Integration Phase 2 — Webhooks, Feature Gating & UI

## Overview

Connect the Phase 1 infrastructure (`stripe-phase-1-spec.md`) to real Stripe events and the app: a signed webhook that keeps `User.isPro` in sync, server-side enforcement of the free-plan limits and Pro-only uploads, a Billing card on `/settings`, session-aware homepage pricing buttons, upgrade hints, and canceling the subscription when an account is deleted. Testing needs Stripe test mode and the Stripe CLI.

Reference: `docs/stripe-integration-plan.md` (§5 webhook / Billing card, §6, §7 Dashboard setup, §8 Testing checklist).

## Requirements

- Phase 1 merged (`stripe`, `src/lib/stripe.ts`, `src/lib/usage-limits.ts`, `src/lib/db/billing.ts`, `src/lib/billing.ts`, `src/actions/billing.ts`, session `isPro`)
- Create `POST /api/webhooks/stripe`
- Enforce limits and Pro features on the server in `createItem`, `createCollection` and `POST /api/upload`
- Add a Billing card to `/settings` with upgrade (monthly / yearly) and Manage billing
- Update the homepage pricing buttons for signed-in free and Pro users
- Show upgrade hints in the New Item dialog and a PRO badge in the user menu
- Cancel the Stripe subscription in `deleteAccount`
- Stripe Dashboard test-mode setup; no migration

## Webhook — `src/app/api/webhooks/stripe/route.ts`

- No session: the Stripe signature is the authentication; stays outside the `src/proxy.ts` matcher (it already skips `/api`)
- Missing `stripe-signature` → 400; `webhooks.constructEvent(await request.text(), signature, getWebhookSecret())` failing → 400 (raw body, never parsed JSON)
- Handled events:

| Event | Action |
| --- | --- |
| `checkout.session.completed` | when `mode === "subscription"` and `subscription` is a string, `syncSubscriptionById(subscription)` |
| `customer.subscription.created` | `syncSubscriptionById(event.data.object.id)` |
| `customer.subscription.updated` | same |
| `customer.subscription.deleted` | same (retrieve returns `status: "canceled"`) |

- Unhandled types → 200 so Stripe doesn't retry
- Handling errors → logged, `jsonError(..., 500)` so Stripe retries
- Success → `{ received: true }`
- Idempotent: every event re-fetches the subscription and writes its current state, so no processed-events table

## Feature Gating

Server is the source of truth; `getUserPlan()` reads `isPro` from the database. Skip the count queries when gating is off or the user is Pro.

| Where | Check | Result |
| --- | --- | --- |
| `createItem` (`src/actions/items.ts`), after the session check | upload type and `!canUse("uploads", plan)` | `{ success: false, error: PRO_FEATURE_REQUIRED }` |
| `createItem` | `!canCreateItem(plan, await countUserItems(userId))` | `ITEM_LIMIT_REACHED` |
| `createCollection` (`src/actions/collections.ts`) | `!canCreateCollection(plan, await countUserCollections(userId))` | `COLLECTION_LIMIT_REACHED` |
| `POST /api/upload`, right after the session check and before reading the body | `!canUse("uploads", plan)` | 403 `{ success: false, error: PRO_FEATURE_REQUIRED }` |

- `DELETE /api/upload`, `updateItem`, deleting and favoriting stay open
- Downgraded users keep everything above the limits; they just can't create more
- The count-then-create check isn't atomic (two concurrent creates at 49 could make 51); acceptable for now
- Turned on only by `PRO_GATING_ENABLED=true`

## Billing Card — `/settings`

`src/app/settings/page.tsx` loads `getUserBilling()` (then `getBillingSummary()`), `getItemStats()` and `getCollectionStats()` with the existing `Promise.all`, and renders a **Billing** card after Editor preferences (`id="billing"` with `scroll-mt-*` so `#billing` return URLs land on it). `SettingsSkeleton` gets another block. `searchParams` are awaited inside the existing `<Suspense>`.

`getBillingSummary(user)` (in `src/lib/billing.ts`): retrieves the subscription when there's a `stripeSubscriptionId`; `interval` and `currentPeriodEnd` from `subscription.items.data[0]` (newer API versions moved `current_period_end` to the item), `cancelAtPeriodEnd` from `cancel_at_period_end || cancel_at !== null`, `status`; falls back to the database flags if Stripe fails.

`src/components/settings/BillingCard.tsx` (client):

- **Free:** "Free plan", usage (`12 / 50 items`, `2 / 3 collections`), a monthly / yearly choice with prices from `getProPlanPrice()`, and **Upgrade to Pro** calling `startCheckout(billing)` in `useTransition` (spinner while pending, `toast.error` on a returned error, `NETWORK_ERROR` on a network failure)
- **Pro:** "Pro · Monthly" / "Pro · Yearly", "Renews on <date>" or "Cancels on <date>" (UTC, like other dates), a warning for `past_due` ("Your last payment failed. Update your card to keep Pro."), and **Manage billing** calling `openBillingPortal()`
- `?checkout=success` while still free: "Payment received. Activating Pro… refresh in a moment." (the webhook may arrive after the redirect); when already Pro: "Welcome to Pro!"
- `?checkout=cancelled`: muted "Checkout cancelled. You haven't been charged."
- Verify against the installed Next.js (`node_modules/next/dist/docs/`) that a `redirect()` from a server action called in a client transition navigates and isn't caught by the `catch`; otherwise use a `<form action>` or re-throw redirect errors

## Homepage Pricing

`src/components/home/SessionLinks.tsx` / `PricingSection.tsx`, same `<Suspense>` pattern (signed-out version as fallback) so `/` stays partially prerendered, with `isPro` from `getUserPlan()`:

| Visitor | Free card | Pro card |
| --- | --- | --- |
| Signed out | "Get started" → `/register` | "Upgrade to Pro" → `/register` |
| Signed in, free | "Current plan" label | "Upgrade to Pro" → `/settings#billing` |
| Signed in, Pro | no button (or muted "Included") | "Current plan" label |

## UI Hints

- `NewItemDialog`: a server-computed `canUpload` prop (from `canUse("uploads", plan)`); when `false`, File / Image tiles show a lock and the upload zone is replaced by "File and image uploads are a Pro feature" with an **Upgrade** link to `/settings#billing`
- Limit errors from `createItem` / `createCollection` show as the existing error toast
- `SidebarUserMenu`: small "PRO" badge (same style as the sidebar type badge) next to the name when `session.user.isPro`
- The sidebar File / Image PRO badges stay as they are

## Account Deletion — `deleteAccount` (`src/actions/profile.ts`)

- Select `stripeSubscriptionId` with the email and file URLs
- When set, `cancelSubscription(id)` **before** deleting the user
- If canceling fails: log it, return `GENERIC_ERROR` and keep the account (so the user isn't charged for a deleted account)

## Stripe Dashboard Setup (test mode)

1. Product "DevStash Pro" with two recurring USD prices: **$8 / month** and **$72 / year** → `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`
2. Customer Portal: update payment method, invoice history, cancel at period end, switch between the two prices; default return URL `http://localhost:3000/settings`
3. Billing settings: smart retries, cancel the subscription after all retries fail
4. Stripe CLI:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Put the printed `whsec_…` into `.env` as `STRIPE_WEBHOOK_SECRET` and restart `npm run dev`.

Production (later, at launch): live-mode product and prices, webhook endpoint `https://<domain>/api/webhooks/stripe` with the four events above, and `STRIPE_*`, `NEXT_PUBLIC_APP_URL`, `PRO_GATING_ENABLED` in `.env.production`.

## Testing

### Unit tests (Stripe, Prisma and `@/auth` mocked)

- `src/app/api/webhooks/stripe/route.test.ts` — missing signature 400, bad signature 400, `checkout.session.completed` (subscription mode) syncs, payment-mode session ignored, `customer.subscription.updated` / `.deleted` sync, unhandled type 200, handler failure 500
- `src/lib/billing.test.ts` — `getBillingSummary`: no subscription, monthly / yearly, cancel at period end, Stripe failure fallback
- `src/actions/items.test.ts` — gating on: free user at 50 items refused, at 49 allowed, file / image refused for free, allowed for Pro; gating off: all allowed and no count query
- `src/actions/collections.test.ts` — same at 3 collections
- `src/app/api/upload/route.test.ts` — free user with gating on → 403 before the body is read; Pro → upload proceeds
- `src/actions/profile.test.ts` — Pro user's subscription canceled before deletion; cancel failure → `GENERIC_ERROR`, user not deleted; no subscription → no Stripe call

### Manual (test mode, `stripe listen` running)

1. Free user → `/settings` → Upgrade (monthly) → Checkout shows $8/month → pay with `4242 4242 4242 4242` → back on `/settings?checkout=success#billing`
2. `stripe listen` shows `checkout.session.completed` and `customer.subscription.created` with 200; the user on the **dev branch** has `isPro = true` and both Stripe ids
3. Reload → Billing card shows Pro, Monthly, renewal date; the user menu shows PRO
4. Upgrade with yearly → Checkout shows $72/year
5. Cancel on the Checkout page → `?checkout=cancelled`, still free
6. A Pro user can't start a second checkout
7. Declined card `4000 0000 0000 0002` → error on Checkout, user stays free; 3-D Secure `4000 0025 0000 3155` completes after the challenge
8. Manage billing → portal; switch to yearly (still Pro, card shows Yearly); cancel at period end ("Cancels on …", still Pro); renew
9. Cancel immediately (`stripe subscriptions cancel <id>` or Dashboard) → `customer.subscription.deleted` → `isPro = false`, `stripeSubscriptionId = null`, card back to Free after reload
10. `stripe events resend <evt_id>` → same final state; `curl -X POST` without a signature → 400
11. Test clock + card `4000 0000 0000 0341` → `past_due` keeps Pro with the warning; after retries → `canceled`, free
12. `PRO_GATING_ENABLED=true`: free user at 3 collections and at 50 items gets the limit toasts; File / Image locked in the New Item dialog; `POST /api/upload` returns 403; Pro user unrestricted; with the variable unset everything is open again
13. Homepage signed out / free / Pro shows the buttons from the table above
14. Delete a Pro test account → subscription canceled in Stripe, user gone
15. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` pass; no console errors

Ask before any `UPDATE` / `DELETE` on the dev branch and clean up test users afterwards.

## Notes

- `past_due` keeps Pro while Stripe retries the card; `unpaid` and `canceled` remove it
- Server enforcement reads the database; the session `isPro` is for display only
- No free trial in this phase (`trialing` already counts as Pro if one is added later)
- Optional: a `billing` entry in `RATE_LIMITS` for `startCheckout` / `openBillingPortal`

## References

- Plan: `docs/stripe-integration-plan.md`
- Webhook signatures: https://docs.stripe.com/webhooks/signatures
- Subscription webhooks: https://docs.stripe.com/billing/subscriptions/webhooks
- Customer portal: https://docs.stripe.com/customer-management/integrate-customer-portal
- Stripe CLI: https://docs.stripe.com/stripe-cli
- Test cards: https://docs.stripe.com/testing
- Test clocks: https://docs.stripe.com/billing/testing/test-clocks
