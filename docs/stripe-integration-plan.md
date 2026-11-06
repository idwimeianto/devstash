# Stripe Integration Plan — DevStash Pro

> Research output for `context/research/stripe-integration-research.md`.
> Goal: Stripe subscriptions for **DevStash Pro** at **$8/month** or **$72/year**, with free-plan limits (50 items, 3 collections) and Pro-only features gated in one place.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Feature Gating Analysis](#2-feature-gating-analysis)
3. [API, Action & Env Patterns](#3-api-action--env-patterns)
4. [Design Decisions](#4-design-decisions)
5. [Files to Create](#5-files-to-create)
6. [Files to Modify](#6-files-to-modify)
7. [Stripe Dashboard Setup](#7-stripe-dashboard-setup)
8. [Testing Checklist](#8-testing-checklist)
9. [Implementation Order](#9-implementation-order)
10. [Open Questions](#10-open-questions)

---

## 1. Current State Analysis

### User model (`prisma/schema.prisma`)

The billing fields already exist, so **no migration is required** for the basic integration:

```prisma
model User {
  // ...
  // Billing
  isPro                Boolean @default(false)
  stripeCustomerId     String? @unique
  stripeSubscriptionId String? @unique
  // ...
}
```

- `isPro` is never read or written by app code today (only the generated client and the old `mock-data.ts`).
- Both Stripe ids are `@unique`, so a webhook can look a user up by `stripeCustomerId` with `findUnique`.
- Deleting a user cascades to all content (`onDelete: Cascade`), but nothing cancels a Stripe subscription — see [§6 `src/actions/profile.ts`](#srcactionsprofilets).

### NextAuth configuration

| File | Role |
| --- | --- |
| `src/auth.config.ts` | Edge-safe config shared with the proxy: GitHub + placeholder Credentials provider, `pages.signIn`, and `jwt` / `session` callbacks that copy `user.id` → `token.id` → `session.user.id`. **No database access.** |
| `src/auth.ts` | Full config: `PrismaAdapter(prisma)`, `session: { strategy: "jwt" }`, real Credentials `authorize` (Zod, rate limit, bcrypt, email verification). Spreads `authConfig` and swaps the credentials provider. |
| `src/proxy.ts` | `NextAuth(authConfig)` (no adapter), protects `/dashboard`, `/items`, `/collections`, `/favorites`, `/profile`, `/settings`; **does not match `/api`**, so API routes check the session themselves. |
| `src/types/next-auth.d.ts` | Augments `Session.user` with `id: string`. No `JWT` augmentation yet. |

Important details for Stripe:

- The token stores the user id in **`token.id`**, not `token.sub`. The workaround in the research notes uses `token.sub`; it must be adapted to `token.id` (see [§6 `src/auth.ts`](#srcauthts)).
- The DB-syncing `jwt` callback must live in **`src/auth.ts`**, not `auth.config.ts`, so the proxy stays free of Prisma (same reason the Credentials provider is split).
- Sessions are JWTs. A webhook changing `isPro` doesn't touch the cookie, which is why the token must re-read `isPro` from the database.

### How user data is accessed

- `getSessionUserId()` in `src/lib/db/users.ts` — `cache()`d per request, calls `connection()` before `auth()`, returns `string | null`. Used by every server action and API route ("Always the session's user, never one from the client").
- `getCurrentUserId()` — same, but returns `""` when signed out (matches no rows) for server-component queries.
- `getUserProfile(userId)` — profile data for `/profile` and `/settings`.
- Server components fetch with Prisma via `src/lib/db/*.ts`; client components call server actions in `src/actions/*.ts`.

### Existing payment-related code

- **No Stripe code**, no `stripe` package in `package.json`.
- `.env` already contains (values not inspected): `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`. `.env.production` has none of them yet.
- Pricing constants live in `src/lib/home-content.ts`: `FREE_ITEM_LIMIT = 50`, `FREE_COLLECTION_LIMIT = 3`, `PRO_MONTHLY_PRICE = 8`, `PRO_YEARLY_PRICE = 72`, `Billing = "monthly" | "yearly"`, `getProPlanPrice()`, `FREE_PLAN_FEATURES`, `PRO_PLAN_FEATURES`.
- Homepage pricing (`src/components/home/PricingSection.tsx`): the Pro button links to `/register` for everyone; `FreePlanCta` (`SessionLinks.tsx`) shows "Current plan" for any signed-in user ("Every account is on the free plan until billing exists"). `BillingToggle` / `ProPrice` provide the monthly/yearly toggle via context.
- `PRO_ITEM_TYPES` + `isProItemType()` in `src/lib/item-type-display.ts` — display-only "PRO" badge next to File and Image in the sidebar.

---

## 2. Feature Gating Analysis

### Free vs Pro (project overview)

| Feature | Free | Pro | Exists today? |
| --- | --- | --- | --- |
| Items | 50 total | Unlimited | ✅ create via `createItem` action |
| Collections | 3 | Unlimited | ✅ create via `createCollection` action |
| File & image uploads | ❌ | ✅ | ✅ `POST /api/upload` + `createItem` |
| Custom types | ❌ | ✅ (later) | ❌ not built |
| AI features | ❌ | ✅ | ❌ not built |
| Export (JSON / ZIP) | ❌ | ✅ | ❌ not built |

> 🛠️ The overview says: build the Pro foundation but keep **all features open during development**, with gating in one `canUse(feature, user)`-style helper switched on by a single change.

### Where counts are / could be checked

| Check | Location | How |
| --- | --- | --- |
| Item limit | `createItem` in `src/actions/items.ts`, after `getSessionUserId()` and before `createItemQuery` | `prisma.item.count({ where: { userId } })` — same query as `getItemStats()` in `src/lib/db/items.ts` |
| Collection limit | `createCollection` in `src/actions/collections.ts`, same position | `prisma.collection.count({ where: { userId } })` — as in `getCollectionStats()` in `src/lib/db/collections.ts` |
| File / image items | `createItem` (`isUploadKind(common.typeName)` branch) | Pro check before `getStoredUpload()` |
| File / image uploads | `POST /api/upload` in `src/app/api/upload/route.ts`, right after the session check | Pro check **before** reading the body, so free users can't fill R2 |
| UI hints | `NewItemDialog` type tiles, `TopBar` "New Collection", `/collections` "New Collection", sidebar PRO badge | Disable / show "Upgrade" — UI only, server is the source of truth |

Notes:

- **Server-side enforcement is required** (overview §9). UI hints are a convenience.
- `updateItem` doesn't need a limit; editing never adds items. Changing an item's type isn't possible, so a free user can't turn a note into a file.
- Downgrades: a user who drops from Pro keeps existing items/collections/files above the limit; they just can't create more. Nothing is deleted.
- The count-then-create check isn't atomic; two concurrent creates at 49 items could yield 51. Acceptable for a soft limit; move the count into the `createItem` transaction later if it matters.

### Settings page structure (`src/app/settings/page.tsx`)

Standalone page (no sidebar), "Back to dashboard" link, then inside one `<Suspense>`:

1. **Editor preferences** card
2. **Change password** card (only when `hasPassword`)
3. **Delete account** card (`ring-destructive/30`)

`SettingsContent` already loads `getUserProfile()` and `getEditorPreferences()` in parallel. A **Billing** card fits between Editor preferences and Change password, loaded with a new `getUserBilling()` in the same `Promise.all`, with a third skeleton height added to `SettingsSkeleton`.

---

## 3. API, Action & Env Patterns

### API routes

- Live in `src/app/api/**/route.ts`, export `GET` / `POST` / `DELETE` taking `Request` (+ `RouteContext` for params).
- Check the session themselves (`getSessionUserId()`), since the proxy doesn't cover `/api`.
- Errors: `jsonError(error, status)` from `src/lib/api-response.ts` → `{ success: false, error }`; success `{ success: true, data }`.
- Statuses used: 400, 401, 404, 409, 413, 429, 500, 502; `console.error("<What> failed", error)` before 500s.

A Stripe webhook is the textbook API-route case in `context/coding-standards.md` ("Webhooks (Stripe, GitHub, etc.)").

### Server actions

- `"use server"` files in `src/actions/[feature].ts`.
- Order: validate input (Zod `safeParse` → `validationFailure()`, or `typeof` checks for ids/booleans) → `getSessionUserId()` (`NOT_SIGNED_IN`) → `try { … } catch { console.error(...); return { success: false, error: GENERIC_ERROR } }`.
- Results: `{ success: true, data } | { success: false, error, fieldErrors? }`, typed in `src/types/[feature].ts`.
- `redirect()` / `signOut({ redirectTo })` are called **outside** the `try` (they throw).
- Client side: `runItemAction()` in `src/lib/run-item-action.ts` shows the network-error / error / success toast.
- Messages shared in `src/lib/messages.ts` (`NOT_SIGNED_IN`, `GENERIC_ERROR`, `NETWORK_ERROR`).

### Environment variables

- Read lazily inside functions so builds and tests don't need them: `requireEnv(name)` in `src/lib/r2.ts` throws `"<NAME> is not set"`; clients created on first use (`client ??= new S3Client(...)`).
- Feature toggles get one reader function in its own file: `isEmailVerificationEnabled()` in `src/lib/email-verification.ts` (on unless exactly `"false"`).
- Absolute URLs come from `getAppUrl()` (`src/lib/app-url.ts`, `NEXT_PUBLIC_APP_URL`, `http://localhost:3000` fallback outside production) — never from the Host header. Use it for Checkout / Portal return URLs.
- No `.env.example` exists.

---

## 4. Design Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Checkout UI | **Stripe-hosted Checkout** (redirect) | No card UI, PCI scope or Stripe.js needed; `STRIPE_PUBLISHABLE_KEY` stays unused. |
| Subscription management | **Stripe Customer Portal** | Cancel, switch monthly ↔ yearly, update card, invoices — no custom UI. |
| Starting Checkout / Portal | **Server actions** that `redirect()` to the Stripe URL | Matches "server actions for simple mutations"; `redirect()` accepts external URLs. |
| Webhook | `POST /api/webhooks/stripe` | Needs the raw body and specific status codes. |
| Source of truth | Stripe subscription → webhook → `User.isPro` / `stripeSubscriptionId` | One writer of billing state. |
| Event handling | Re-fetch the subscription from Stripe on every relevant event, then write the derived state | Idempotent and safe with out-of-order / repeated events; no processed-events table needed. |
| What counts as Pro | `status` in `active`, `trialing`, `past_due` | `past_due` keeps access while Stripe retries the card; `unpaid` / `canceled` / `incomplete*` drop it. |
| Server-side gating | Reads `isPro` **from the database** (`getUserPlan()`, `cache()`d per request) | Never trusts a possibly stale JWT for enforcement. |
| Session `isPro` | Synced from DB in the `jwt` callback (research-note workaround) | For UI only (badges, settings, homepage) and picked up by a plain reload after checkout. |
| Gating switch | `PRO_GATING_ENABLED` env read only by `isProGatingEnabled()`; off unless exactly `"true"` | Overview: everything open during development, one switch to turn on. |
| Limits / prices | Move to `src/lib/plans.ts`, re-exported from `home-content.ts` | One place for both the homepage copy and enforcement. |
| Schema | **No migration** for v1 | Existing fields suffice; period end / cancel state is fetched from Stripe for the settings card. |

---

## 5. Files to Create

### `src/lib/stripe.ts` — client (server only)

```ts
import Stripe from "stripe";

// Created on first use so builds and tests don't need the env.
let client: Stripe | undefined;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

// The SDK pins the API version it was built for, so no apiVersion is passed.
export function getStripe(): Stripe {
  client ??= new Stripe(requireEnv("STRIPE_SECRET_KEY"));
  return client;
}

export function getWebhookSecret(): string {
  return requireEnv("STRIPE_WEBHOOK_SECRET");
}

export function getPriceId(billing: "monthly" | "yearly"): string {
  return requireEnv(billing === "yearly" ? "STRIPE_PRICE_ID_YEARLY" : "STRIPE_PRICE_ID_MONTHLY");
}
```

> `requireEnv` now exists in `r2.ts` too; consider moving it to `src/lib/env.ts` and importing it in both (small, optional refactor — ask first).

### `src/lib/plans.ts` — limits, Pro features, gating (client-safe, no Prisma)

```ts
import type { Billing } from "@/lib/home-content";

export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;
export const PRO_MONTHLY_PRICE = 8;
export const PRO_YEARLY_PRICE = 72;

export const BILLING_OPTIONS = ["monthly", "yearly"] as const satisfies readonly Billing[];

export type ProFeature = "uploads" | "customTypes" | "ai" | "export";

// Subscription statuses that keep Pro access; past_due keeps it while Stripe retries the card.
const PRO_STATUSES = new Set(["active", "trialing", "past_due"]);

export function isProStatus(status: string): boolean {
  return PRO_STATUSES.has(status);
}

export interface PlanUser {
  isPro: boolean;
}

// Every user can use everything until PRO_GATING_ENABLED is exactly "true".
export function isProGatingEnabled(): boolean {
  return process.env.PRO_GATING_ENABLED === "true";
}

export function canUse(_feature: ProFeature, user: PlanUser): boolean {
  return !isProGatingEnabled() || user.isPro;
}

export function canCreateItem(user: PlanUser, itemCount: number): boolean {
  return !isProGatingEnabled() || user.isPro || itemCount < FREE_ITEM_LIMIT;
}

export function canCreateCollection(user: PlanUser, collectionCount: number): boolean {
  return !isProGatingEnabled() || user.isPro || collectionCount < FREE_COLLECTION_LIMIT;
}

export const ITEM_LIMIT_REACHED = `The free plan includes ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`;
export const COLLECTION_LIMIT_REACHED = `The free plan includes ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections.`;
export const PRO_FEATURE_REQUIRED = "File and image uploads are a Pro feature.";
```

> `process.env.PRO_GATING_ENABLED` isn't `NEXT_PUBLIC_`, so `isProGatingEnabled()` returns `false` in the browser. Client components should receive the computed result (e.g. `canUpload`) as a prop from a server component rather than calling `canUse` themselves.

`src/lib/home-content.ts` then imports the four constants from `plans.ts` instead of defining them (and keeps exporting them so `home-content.test.ts` and the homepage don't change).

### `src/lib/db/billing.ts` — billing queries

```ts
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import type { UserBilling } from "@/types/billing";

// Read from the database, not the JWT, so enforcement never uses a stale session.
export const getUserPlan = cache(async (userId: string): Promise<{ isPro: boolean }> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPro: true } });
  return { isPro: user?.isPro ?? false };
});

export async function getUserBilling(userId: string): Promise<UserBilling | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, isPro: true, stripeCustomerId: true, stripeSubscriptionId: true },
  });
}

export async function setStripeCustomerId(userId: string, customerId: string) {
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
}

// False when no user has this customer id (e.g. the account was deleted).
export async function syncSubscription(
  customerId: string,
  data: { isPro: boolean; stripeSubscriptionId: string | null },
): Promise<boolean> {
  const { count } = await prisma.user.updateMany({ where: { stripeCustomerId: customerId }, data });
  return count > 0;
}

export async function countUserItems(userId: string) {
  return prisma.item.count({ where: { userId } });
}

export async function countUserCollections(userId: string) {
  return prisma.collection.count({ where: { userId } });
}
```

(`countUser*` could instead reuse `getItemStats` / `getCollectionStats`, but those run two counts each.)

### `src/lib/billing.ts` — Stripe-side helpers (server only)

```ts
import type Stripe from "stripe";

import { getAppUrl } from "@/lib/app-url";
import { setStripeCustomerId, syncSubscription } from "@/lib/db/billing";
import { isProStatus } from "@/lib/plans";
import { getPriceId, getStripe } from "@/lib/stripe";
import type { UserBilling } from "@/types/billing";

// Reuses the saved customer, so a user never ends up with two.
export async function getOrCreateCustomer(userId: string, user: UserBilling): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await getStripe().customers.create(
    { email: user.email, name: user.name ?? undefined, metadata: { userId } },
    { idempotencyKey: `customer-${userId}` },
  );
  await setStripeCustomerId(userId, customer.id);
  return customer.id;
}

export async function createCheckoutUrl(
  userId: string,
  customerId: string,
  billing: "monthly" | "yearly",
): Promise<string> {
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: userId,
    line_items: [{ price: getPriceId(billing), quantity: 1 }],
    subscription_data: { metadata: { userId } },
    allow_promotion_codes: true,
    success_url: `${getAppUrl()}/settings?checkout=success#billing`,
    cancel_url: `${getAppUrl()}/settings?checkout=cancelled#billing`,
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

// Writes the subscription's current state; safe to run for any event, in any order, any number of times.
export async function applySubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const isPro = isProStatus(subscription.status);

  const found = await syncSubscription(customerId, {
    isPro,
    stripeSubscriptionId: subscription.status === "canceled" ? null : subscription.id,
  });
  if (!found) console.warn("Stripe webhook for an unknown customer", customerId);
}

export async function syncSubscriptionById(subscriptionId: string): Promise<void> {
  // Always the latest state from Stripe, never the possibly older event payload.
  await applySubscription(await getStripe().subscriptions.retrieve(subscriptionId));
}
```

### `src/actions/billing.ts` — server actions

```ts
"use server";

import { redirect } from "next/navigation";

import { createCheckoutUrl, createPortalUrl, getOrCreateCustomer } from "@/lib/billing";
import { getUserBilling } from "@/lib/db/billing";
import { getSessionUserId } from "@/lib/db/users";
import { GENERIC_ERROR, NOT_SIGNED_IN } from "@/lib/messages";
import { BILLING_OPTIONS } from "@/lib/plans";
import type { BillingActionResult } from "@/types/billing";

const ALREADY_PRO = "You're already on Pro. Manage your plan from Billing.";
const NO_CUSTOMER = "There's no billing account yet. Upgrade to Pro first.";

export async function startCheckout(billing: string): Promise<BillingActionResult> {
  if (!(BILLING_OPTIONS as readonly string[]).includes(billing)) {
    return { success: false, error: GENERIC_ERROR };
  }

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
    url = await createCheckoutUrl(userId, customerId, billing as "monthly" | "yearly");
  } catch (error) {
    console.error("Starting checkout failed", error);
    return { success: false, error: GENERIC_ERROR };
  }

  // Throws Next.js's redirect, so it stays outside the try.
  redirect(url);
}

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
```

Optionally add a `billing: { requests: 10, window: "15 m" }` entry to `RATE_LIMITS` in `src/lib/rate-limit.ts` and check it before creating Stripe sessions.

### `src/app/api/webhooks/stripe/route.ts` — webhook

```ts
import type Stripe from "stripe";

import { jsonError } from "@/lib/api-response";
import { applySubscription, syncSubscriptionById } from "@/lib/billing";
import { getStripe, getWebhookSecret } from "@/lib/stripe";

// Called by Stripe, not a browser: no session. The signature is the authentication.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return jsonError("Missing signature", 400);

  let event: Stripe.Event;
  try {
    // The raw body, exactly as sent; a parsed and re-serialized body fails the check.
    event = getStripe().webhooks.constructEvent(await request.text(), signature, getWebhookSecret());
  } catch (error) {
    console.error("Stripe webhook signature check failed", error);
    return jsonError("Invalid signature", 400);
  }

  try {
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
        // Re-fetched so an older event arriving late can't overwrite newer state.
        await syncSubscriptionById(event.data.object.id);
        break;
      default:
        break;
    }
  } catch (error) {
    // A 5xx makes Stripe retry the event later.
    console.error(`Handling Stripe event ${event.type} failed`, error);
    return jsonError("Webhook handling failed", 500);
  }

  return Response.json({ received: true });
}
```

Notes:

- `subscriptions.retrieve` works for deleted subscriptions too (it returns `status: "canceled"`), so `.deleted` goes through the same path.
- Unhandled event types return 200 so Stripe doesn't retry them.
- `checkout.session.completed` and `customer.subscription.created` both arrive for a new subscription; handling both is harmless because the write is idempotent, and makes Pro appear as early as possible.
- On newer Stripe API versions (2025-03-31 "basil" and later), `current_period_end` lives on `subscription.items.data[0]`, and an invoice's subscription on `invoice.parent.subscription_details.subscription`. The plan above doesn't need either, but the settings card does (below).

### `src/types/billing.ts`

```ts
export interface UserBilling {
  email: string;
  name: string | null;
  isPro: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

// Successful actions redirect to Stripe, so only failures come back.
export type BillingActionResult = { success: false; error: string };

export interface BillingSummary {
  isPro: boolean;
  hasCustomer: boolean;
  interval: "month" | "year" | null;
  currentPeriodEnd: string | null; // ISO
  cancelAtPeriodEnd: boolean;
  status: string | null;
}
```

### `src/lib/billing-summary.ts` (or inside `src/lib/billing.ts`) — settings card data

```ts
// Live details for the settings card; falls back to the database flags if Stripe is unreachable.
export async function getBillingSummary(user: UserBilling): Promise<BillingSummary> {
  const base = {
    isPro: user.isPro,
    hasCustomer: user.stripeCustomerId !== null,
    interval: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    status: null,
  };
  if (!user.stripeSubscriptionId) return base;

  try {
    const subscription = await getStripe().subscriptions.retrieve(user.stripeSubscriptionId);
    const item = subscription.items.data[0];
    return {
      ...base,
      interval: item?.price.recurring?.interval === "year" ? "year" : "month",
      currentPeriodEnd: item ? new Date(item.current_period_end * 1000).toISOString() : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || subscription.cancel_at !== null,
      status: subscription.status,
    };
  } catch (error) {
    console.error("Loading the Stripe subscription failed", error);
    return base;
  }
}
```

### `src/components/settings/BillingCard.tsx` (client) — Billing card content

Behavior:

- **Free:** "Free plan — 50 items, 3 collections" plus usage (`12 / 50 items`, `2 / 3 collections` from `getItemStats` / `getCollectionStats`), the monthly/yearly toggle (reuse `getProPlanPrice()` for the labels) and an **Upgrade to Pro** button that calls `startCheckout(billing)` inside `useTransition` (spinner while pending; on a returned error, `toast.error`).
- **Pro:** "Pro — Monthly / Yearly", "Renews on <date>" or "Cancels on <date>" (UTC, like other dates), `past_due` warning ("Payment failed — update your card"), and **Manage billing** calling `openBillingPortal()`.
- **`?checkout=success`** while `isPro` is still false: "Payment received. Activating Pro… refresh in a moment." (the webhook may land after the redirect). `?checkout=cancelled`: a muted "Checkout cancelled."
- Card wrapper gets `id="billing"` and `scroll-mt-*` so the `#billing` return URLs land on it.

```tsx
"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { openBillingPortal, startCheckout } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { NETWORK_ERROR } from "@/lib/messages";
import type { BillingSummary } from "@/types/billing";

export function UpgradeButton({ billing }: { billing: "monthly" | "yearly" }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            // Only returns on failure; success redirects to Stripe Checkout.
            const result = await startCheckout(billing);
            toast.error(result.error);
          } catch {
            toast.error(NETWORK_ERROR);
          }
        })
      }
    >
      {pending && <Loader2 className="animate-spin" />}
      Upgrade to Pro
    </Button>
  );
}
```

> Check before relying on it: a `redirect()` thrown from a server action called from a client transition navigates the browser, and must not be swallowed by the `catch`. In Next.js it's handled by the framework before the promise rejects in user code, but verify with the installed version (`node_modules/next/dist/docs/`) — if the `catch` sees it, re-throw errors where `isRedirectError(error)` or call the action through a `<form action>` instead.

### Tests (next to their files)

| File | Covers |
| --- | --- |
| `src/lib/plans.test.ts` | `isProStatus` per status; `canUse` / `canCreateItem` / `canCreateCollection` with gating off (always true) and on (`vi.stubEnv("PRO_GATING_ENABLED", "true")`): Pro, free under, at and over the limit |
| `src/lib/billing.test.ts` | `getOrCreateCustomer` reuses / creates and saves; `applySubscription` for active, past_due, canceled (`stripeSubscriptionId: null`), unknown customer; Checkout params (mode, price per billing, `client_reference_id`, URLs from `getAppUrl`) — `@/lib/stripe` and `@/lib/db/billing` mocked |
| `src/actions/billing.test.ts` | `startCheckout`: invalid billing, signed out, already Pro, Stripe failure → `GENERIC_ERROR`, success calls `redirect` (mock `next/navigation`); `openBillingPortal`: no customer, success, failure |
| `src/app/api/webhooks/stripe/route.test.ts` | missing signature 400, bad signature 400, `checkout.session.completed` syncs, `customer.subscription.deleted` syncs, unhandled type 200, DB failure 500 — mock `constructEvent` and `subscriptions.retrieve` |
| `src/actions/items.test.ts`, `collections.test.ts` | new cases: limit reached / not reached with gating on, file type blocked for free users, gating off allows all |
| `src/app/api/upload/route.test.ts` | free user with gating on → 403 before the body is read |
| `src/actions/profile.test.ts` | `deleteAccount` cancels an active subscription; a Stripe failure returns `GENERIC_ERROR` and keeps the account (if blocking is chosen, see §10) |

Never hit Stripe in tests: mock `@/lib/stripe` with `vi.mock` (coding standards). For a realistic signature test, `stripe.webhooks.generateTestHeaderString({ payload, secret })` can sign a fake payload with a test secret, no network involved.

---

## 6. Files to Modify

### `package.json`

```bash
npm install stripe
```

(Context7 lists `stripe-node` v23.x as the current major; install the latest stable and don't pass `apiVersion`, so the SDK's pinned version and its types match.)

### `src/types/next-auth.d.ts`

```ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPro: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isPro?: boolean;
  }
}
```

(Check the module path against the installed `next-auth` beta: in v5 the JWT type is re-exported from `@auth/core/jwt`; augment whichever `JWT` the callbacks resolve to.)

### `src/auth.config.ts`

Copy `isPro` from the token to the session (still no DB access here):

```ts
session({ session, token }) {
  if (typeof token.id === "string") {
    session.user.id = token.id;
  }
  session.user.isPro = token.isPro === true;
  return session;
},
```

### `src/auth.ts`

Override `jwt` in the full config so it syncs `isPro` from the database on every validation — the research-note workaround, adapted to this codebase's `token.id` and kept out of the proxy:

```ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Runs here, not in auth.config.ts, so the proxy stays free of Prisma.
    // Always re-read isPro: a Stripe webhook changes it without touching the cookie,
    // and `trigger === "update"` doesn't reliably refresh it.
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);
      if (typeof token.id === "string") {
        const user = await prisma.user.findUnique({
          where: { id: token.id },
          select: { isPro: true },
        });
        token.isPro = user?.isPro ?? false;
      }
      return token;
    },
  },
  providers: /* unchanged */,
});
```

Trade-off: one small primary-key query per `auth()` call. `getSessionUserId()` is `cache()`d, so that's at most once per request on the server. The proxy uses its own `NextAuth(authConfig)` and doesn't run this callback, so it carries over the last `isPro` in the cookie — fine, since the proxy never gates on Pro.

### `src/lib/home-content.ts`

Replace the four pricing constants with re-exports from `@/lib/plans` (`FREE_ITEM_LIMIT`, `FREE_COLLECTION_LIMIT`, `PRO_MONTHLY_PRICE`, `PRO_YEARLY_PRICE`). Everything else unchanged.

### `src/actions/items.ts` — `createItem`

After `getSessionUserId()`, inside the `try`, before the collection check:

```ts
const plan = await getUserPlan(userId);
if (isUploadKind(common.typeName) && !canUse("uploads", plan)) {
  return { success: false, error: PRO_FEATURE_REQUIRED };
}
if (!canCreateItem(plan, await countUserItems(userId))) {
  return { success: false, error: ITEM_LIMIT_REACHED };
}
```

(Skip `countUserItems` when gating is off or the user is Pro, to avoid a query per create: `canCreateItem` can take a lazy count, or check `isProGatingEnabled() && !plan.isPro` first.)

### `src/actions/collections.ts` — `createCollection`

Same pattern with `countUserCollections` and `COLLECTION_LIMIT_REACHED`.

### `src/app/api/upload/route.ts` — `POST`

Right after the session check, before the `Content-Length` check and `formData()`:

```ts
if (!canUse("uploads", await getUserPlan(userId))) {
  return json({ success: false, error: PRO_FEATURE_REQUIRED }, 403);
}
```

`DELETE` stays open, so a user who lost Pro can still discard an upload.

### `src/actions/profile.ts` — `deleteAccount`

Cancel the subscription **before** deleting the user, otherwise Stripe keeps billing a deleted account and the webhook finds no user:

```ts
select: { email: true, stripeSubscriptionId: true, items: { … } },
// …
if (user.stripeSubscriptionId) {
  await cancelSubscription(user.stripeSubscriptionId); // new helper in src/lib/billing.ts
}
```

Decide whether a cancel failure blocks deletion (safer for the user's wallet: return `GENERIC_ERROR` and keep the account) or is only logged. Recommended: **block**, since a silent failure keeps charging them.

### `src/app/settings/page.tsx`

- Load `getUserBilling(userId)` (then `getBillingSummary`) plus `getItemStats` / `getCollectionStats` alongside the existing `Promise.all`.
- Insert a **Billing** card (`id="billing"`) after Editor preferences.
- Add a skeleton block to `SettingsSkeleton`.
- Read `searchParams` for `checkout=success|cancelled` (await it inside the `<Suspense>`, as `/items/[type]` does with params).

### `src/components/home/PricingSection.tsx` & `SessionLinks.tsx`

- Pro button: signed out → `/register` (unchanged); signed in free → `/settings#billing` (or start checkout with the toggle's billing — needs a client button reading `BillingToggle`'s context); signed in Pro → "Current plan" label.
- `FreePlanCta`: "Current plan" only for free users; Pro users see nothing or "Included".
- Read `isPro` from `getUserPlan()` in the existing `<Suspense>` pattern so `/` stays partially prerendered.

### UI hints (optional for v1, server already enforces)

- `NewItemDialog`: when the server passes `canUpload: false`, File / Image tiles show a lock and "Upgrade to Pro" link instead of the upload zone.
- "New Collection" buttons: when at the limit, the dialog shows the limit message up front (the action's error toast already covers it).
- Sidebar user menu: a "PRO" badge next to the name when `session.user.isPro`.

### `src/proxy.ts`

No change needed: `/settings` is already protected and `/api/webhooks/stripe` must stay **outside** the matcher (Stripe has no session).

### Env files

| Variable | `.env` | `.env.production` | Notes |
| --- | --- | --- | --- |
| `STRIPE_SECRET_KEY` | ✅ exists | add | `sk_test_…` locally, `sk_live_…` in production |
| `STRIPE_WEBHOOK_SECRET` | ✅ exists | add | Local: from `stripe listen`; prod: from the Dashboard endpoint |
| `STRIPE_PRICE_ID_MONTHLY` | ✅ exists | add | Live-mode price ids differ from test-mode ones |
| `STRIPE_PRICE_ID_YEARLY` | ✅ exists | add | |
| `STRIPE_PUBLISHABLE_KEY` | ✅ exists | — | Unused with hosted Checkout; can be removed |
| `NEXT_PUBLIC_APP_URL` | — | add | Required by `getAppUrl()` in production (Checkout return URLs) |
| `PRO_GATING_ENABLED` | add (`false`) | add when launching | `"true"` turns on limits and Pro-only features |

---

## 7. Stripe Dashboard Setup

Do everything in **Test mode** first, then repeat in Live mode at launch.

1. **Account** — Settings → Business: business name "DevStash", support email, statement descriptor (e.g. `DEVSTASH`).
2. **Product** — Product catalog → Add product: name "DevStash Pro", description from `PRO_PLAN_FEATURES`.
   - Price 1: **$8.00 USD, recurring, monthly** → copy `price_…` into `STRIPE_PRICE_ID_MONTHLY`.
   - Price 2: **$72.00 USD, recurring, yearly** → `STRIPE_PRICE_ID_YEARLY`.
3. **API keys** — Developers → API keys: copy the secret key into `STRIPE_SECRET_KEY` (consider a restricted key with write access to Customers, Checkout Sessions, Billing Portal, Subscriptions).
4. **Customer Portal** — Settings → Billing → Customer portal:
   - Allow: update payment methods, view invoice history, cancel subscriptions (**at end of billing period**), switch plans between the two DevStash Pro prices.
   - Set the default return URL to `<NEXT_PUBLIC_APP_URL>/settings`.
   - Add terms / privacy links once those pages exist (footer links are `#` today).
5. **Checkout** — Settings → Checkout: branding (logo, blue `#3b82f6` accent), optionally enable promotion codes and automatic tax.
6. **Emails** — Settings → Customer emails: enable successful-payment receipts and failed-payment emails; Settings → Billing → Subscriptions and emails: smart retries and "after all retries fail → cancel subscription" (the webhook then sees `canceled` and removes Pro).
7. **Webhook (production)** — Developers → Webhooks → Add endpoint `https://<domain>/api/webhooks/stripe` with events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

   Copy its signing secret into the production `STRIPE_WEBHOOK_SECRET`.
8. **Local webhooks** — install the Stripe CLI, then:

   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Put the printed `whsec_…` into `.env` as `STRIPE_WEBHOOK_SECRET` and restart `npm run dev`.

---

## 8. Testing Checklist

### Automated

- [ ] `npm test` — new tests in §5 plus updated item / collection / upload / profile tests pass
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build` pass
- [ ] No test touches Stripe, Prisma or the network (all mocked)

### Manual — Test mode, `stripe listen` running

**Checkout**
- [ ] Free user → Settings → Upgrade (monthly) → Stripe Checkout shows $8/month
- [ ] Pay with `4242 4242 4242 4242` → back on `/settings?checkout=success#billing`
- [ ] `stripe listen` shows `checkout.session.completed` and `customer.subscription.created` with `200`
- [ ] User row on the **dev branch** has `isPro = true`, `stripeCustomerId`, `stripeSubscriptionId` set
- [ ] A reload shows Pro in the Billing card (session `isPro` synced)
- [ ] Yearly checkout shows $72/year
- [ ] Cancel on the Checkout page → `?checkout=cancelled`, still free, no subscription created
- [ ] A Pro user can't start a second checkout (`ALREADY_PRO`)
- [ ] 3-D Secure card `4000 0025 0000 3155` completes after the challenge
- [ ] Declined card `4000 0000 0000 0002` stays on Checkout with an error, user stays free

**Portal**
- [ ] Manage billing opens the portal for the right customer; "Return" lands on `/settings#billing`
- [ ] Switch monthly → yearly → `customer.subscription.updated`, still Pro, card shows Yearly
- [ ] Cancel at period end → still Pro, card shows "Cancels on <date>"
- [ ] Renew (undo cancel) → "Renews on <date>"
- [ ] Cancel immediately (Dashboard or `stripe subscriptions cancel <id>`) → `customer.subscription.deleted` → `isPro = false`, `stripeSubscriptionId = null`

**Payment failures & renewals**
- [ ] Use a **test clock** (Dashboard → Billing → Test clocks) to advance past a renewal: invoice paid, still Pro
- [ ] Card `4000 0000 0000 0341` (attaches, then fails on charge) + advance the clock → `past_due`, still Pro, warning shown; after retries exhausted → `canceled`, free

**Webhook robustness**
- [ ] Request without `stripe-signature` → 400; tampered body → 400
- [ ] `stripe events resend <evt_id>` → same final state (idempotent)
- [ ] Webhook for an unknown customer → 200 and a warning log, no crash
- [ ] Simulated DB failure → 500, Stripe retries

**Gating (`PRO_GATING_ENABLED=true`)**
- [ ] Free user at 50 items → creating another shows the limit toast; nothing saved
- [ ] Free user at 3 collections → limit toast
- [ ] Free user → `POST /api/upload` returns 403; File / Image creation refused
- [ ] Pro user → no limits, uploads work
- [ ] Downgraded user keeps existing items above 50, can edit / delete them, can't add more
- [ ] With `PRO_GATING_ENABLED` unset → everything works for free users (development mode)

**Account deletion**
- [ ] Pro user deletes the account → subscription canceled in Stripe, user gone, no orphan billing

**Homepage**
- [ ] Signed out: both pricing buttons → `/register`
- [ ] Signed in free: Free shows "Current plan", Pro → upgrade
- [ ] Signed in Pro: Pro shows "Current plan"

---

## 9. Implementation Order

Each step is small enough for its own `/feature` cycle (branch → implement → tests → build → commit). Steps 1–5 change no behavior for users while `PRO_GATING_ENABLED` is off.

1. **Plans foundation** — `src/lib/plans.ts` (+ tests), move constants out of `home-content.ts`, `PRO_GATING_ENABLED=false` in `.env`. No Stripe yet.
2. **Session `isPro`** — `next-auth.d.ts` augmentation, `session` callback in `auth.config.ts`, DB-syncing `jwt` override in `auth.ts`. Verify `session.user.isPro` by flipping the flag on the dev branch (with confirmation — it's an `UPDATE`) and reloading.
3. **Stripe client & helpers** — `npm install stripe`, `src/lib/stripe.ts`, `src/lib/db/billing.ts`, `src/lib/billing.ts`, `src/types/billing.ts` (+ tests).
4. **Webhook** — `src/app/api/webhooks/stripe/route.ts` (+ tests); test with `stripe listen` + `stripe trigger checkout.session.completed`.
5. **Checkout & portal actions + Billing card** — `src/actions/billing.ts`, `BillingCard`, settings page changes; run the Checkout / Portal manual checks.
6. **Account deletion** — cancel the subscription in `deleteAccount` (+ tests).
7. **Server-side gating** — `createItem`, `createCollection`, `POST /api/upload` (+ tests); verify with `PRO_GATING_ENABLED=true` locally.
8. **UI hints** — homepage pricing CTAs, New Item dialog locks, PRO badge in the user menu.
9. **Launch** — Live-mode product / prices / portal / webhook, production env vars (incl. `NEXT_PUBLIC_APP_URL`), `PRO_GATING_ENABLED=true` when ready.

---

## 10. Open Questions

- **Grace for `past_due`** — keep Pro while Stripe retries (recommended), or drop it at the first failure?
- **Free trial** — add `subscription_data.trial_period_days` to Checkout? (Then `trialing` already counts as Pro.)
- **Pro button on the homepage** — send signed-in users to `/settings#billing`, or straight into Checkout with the toggle's billing period?
- **Schema extras** — store `stripePriceId` / `stripeCurrentPeriodEnd` / `cancelAtPeriodEnd` to avoid a Stripe call on `/settings`? Would need a Prisma migration.
- **Account deletion** — block deletion when canceling the subscription fails (recommended), or delete anyway?
- **Upgrade from limit errors** — should the "limit reached" toasts include an "Upgrade" action linking to `/settings#billing`?
- **`requireEnv` duplication** — extract a shared `src/lib/env.ts` used by `r2.ts` and `stripe.ts`?
