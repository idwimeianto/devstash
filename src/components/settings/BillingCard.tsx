"use client";

import { Loader2 } from "lucide-react";
import { unstable_rethrow } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { openBillingPortal, startCheckout } from "@/actions/billing";
import { ProBadge } from "@/components/dashboard/ProBadge";
import { Button } from "@/components/ui/button";
import { getProPlanPrice } from "@/lib/home-content";
import { NETWORK_ERROR } from "@/lib/messages";
import {
  BILLING_OPTIONS,
  FREE_COLLECTION_LIMIT,
  FREE_ITEM_LIMIT,
  type Billing,
} from "@/lib/usage-limits";
import { cn } from "@/lib/utils";
import type { BillingActionResult, BillingSummary } from "@/types/billing";

export type CheckoutResult = "success" | "cancelled" | null;

interface BillingCardProps {
  summary: BillingSummary;
  usage: { items: number; collections: number };
  checkout: CheckoutResult;
}

const RENEWAL_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const BILLING_LABELS: Record<Billing, string> = { monthly: "Monthly", yearly: "Yearly" };

// Runs a billing action that redirects to Stripe on success, so only failures come back.
function useBillingAction() {
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<BillingActionResult>) =>
    startTransition(async () => {
      try {
        const result = await action();
        toast.error(result.error);
      } catch (error) {
        // The redirect to Stripe arrives as a thrown router error; let Next.js handle it.
        unstable_rethrow(error);
        toast.error(NETWORK_ERROR);
      }
    });

  return { pending, run };
}

function Notice({ tone, children }: { tone: "success" | "muted" | "warning"; children: ReactNode }) {
  return (
    <p
      role="status"
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        tone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        tone === "warning" && "border-amber-500/30 bg-amber-500/10 text-amber-400",
        tone === "muted" && "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      {children}
    </p>
  );
}

function CheckoutNotice({ checkout, isPro }: { checkout: CheckoutResult; isPro: boolean }) {
  if (checkout === "cancelled") {
    return <Notice tone="muted">Checkout cancelled. You haven&apos;t been charged.</Notice>;
  }
  if (checkout !== "success") return null;
  return isPro ? (
    <Notice tone="success">Welcome to Pro!</Notice>
  ) : (
    // The webhook can land a moment after Stripe sends the user back.
    <Notice tone="success">Payment received. Activating Pro… refresh in a moment.</Notice>
  );
}

function FreePlan({ usage }: { usage: BillingCardProps["usage"] }) {
  const [billing, setBilling] = useState<Billing>("monthly");
  const { pending, run } = useBillingAction();

  return (
    <div className="grid gap-4">
      <div>
        <p className="font-medium">Free plan</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {usage.items} / {FREE_ITEM_LIMIT} items · {usage.collections} / {FREE_COLLECTION_LIMIT}{" "}
          collections
        </p>
      </div>

      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-medium">Upgrade to Pro</legend>
        {BILLING_OPTIONS.map((option) => {
          const { price, period, note } = getProPlanPrice(option);
          return (
            <label
              key={option}
              className="flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40 has-checked:border-blue-500/60 has-checked:bg-blue-500/8 has-focus-visible:ring-2 has-focus-visible:ring-ring"
            >
              <input
                type="radio"
                name="billing"
                value={option}
                checked={billing === option}
                onChange={() => setBilling(option)}
                className="mt-1 accent-blue-500"
              />
              <span className="grid gap-0.5">
                <span className="text-sm font-medium">
                  {BILLING_LABELS[option]} · {price}
                  <span className="font-normal text-muted-foreground">{period}</span>
                </span>
                <span className="text-xs text-muted-foreground">{note}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <Button
        className="justify-self-start"
        disabled={pending}
        onClick={() => run(() => startCheckout(billing))}
      >
        {pending && <Loader2 className="animate-spin" />}
        Upgrade to Pro
      </Button>
    </div>
  );
}

function ProPlan({ summary }: { summary: BillingSummary }) {
  const periodEnd = summary.currentPeriodEnd
    ? RENEWAL_DATE_FORMAT.format(new Date(summary.currentPeriodEnd))
    : null;

  return (
    <div className="grid gap-4">
      <div>
        <p className="flex items-center gap-2 font-medium">
          Pro
          {summary.interval && (
            <span className="text-muted-foreground">
              · {summary.interval === "year" ? "Yearly" : "Monthly"}
            </span>
          )}
          <ProBadge />
        </p>
        {periodEnd && (
          <p className="mt-1 text-sm text-muted-foreground">
            {summary.cancelAtPeriodEnd ? "Cancels on" : "Renews on"} {periodEnd}
          </p>
        )}
      </div>

      {summary.status === "past_due" && (
        <Notice tone="warning">Your last payment failed. Update your card to keep Pro.</Notice>
      )}

      {summary.hasCustomer && <ManageBillingButton />}
    </div>
  );
}

function ManageBillingButton() {
  const { pending, run } = useBillingAction();

  return (
    <Button
      variant="outline"
      className="justify-self-start"
      disabled={pending}
      onClick={() => run(openBillingPortal)}
    >
      {pending && <Loader2 className="animate-spin" />}
      Manage billing
    </Button>
  );
}

// A subscription that no longer grants Pro (e.g. unpaid) can't be replaced by a new checkout,
// so the portal is the way back.
function InactiveSubscription() {
  return (
    <div className="grid gap-4">
      <p className="font-medium">Free plan</p>
      <Notice tone="warning">
        Your Pro subscription is inactive because a payment didn&apos;t go through. Update your
        payment method to restore Pro.
      </Notice>
      <ManageBillingButton />
    </div>
  );
}

function PlanDetails({ summary, usage }: Omit<BillingCardProps, "checkout">) {
  if (summary.isPro) return <ProPlan summary={summary} />;
  if (summary.status !== null) return <InactiveSubscription />;
  return <FreePlan usage={usage} />;
}

export function BillingCard({ summary, usage, checkout }: BillingCardProps) {
  return (
    <div className="grid gap-4">
      <CheckoutNotice checkout={checkout} isPro={summary.isPro} />
      <PlanDetails summary={summary} usage={usage} />
    </div>
  );
}
