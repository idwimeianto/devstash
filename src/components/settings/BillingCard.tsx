"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { openBillingPortal, startCheckout } from "@/actions/billing";
import { BillingOptionPicker } from "@/components/billing/BillingOptionPicker";
import { StatusMessage } from "@/components/common/StatusMessage";
import { ProBadge } from "@/components/dashboard/ProBadge";
import { Button } from "@/components/ui/button";
import { useBillingAction } from "@/hooks/use-billing-action";
import { LONG_DATE } from "@/lib/format-date";
import { FREE_COLLECTION_LIMIT, FREE_ITEM_LIMIT, type Billing } from "@/lib/usage-limits";
import type { BillingSummary } from "@/types/billing";

export type CheckoutResult = "success" | "cancelled" | null;

interface BillingCardProps {
  summary: BillingSummary;
  usage: { items: number; collections: number };
  checkout: CheckoutResult;
}

function CheckoutNotice({ checkout, isPro }: { checkout: CheckoutResult; isPro: boolean }) {
  if (checkout === "cancelled") {
    return (
      <StatusMessage tone="muted">Checkout cancelled. You haven&apos;t been charged.</StatusMessage>
    );
  }
  if (checkout !== "success") return null;
  return isPro ? (
    <StatusMessage tone="success">Welcome to Pro!</StatusMessage>
  ) : (
    // The webhook can land a moment after Stripe sends the user back.
    <StatusMessage tone="success">
      Payment received. Activating Pro… refresh in a moment.
    </StatusMessage>
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

      <BillingOptionPicker value={billing} onChange={setBilling} legend="Upgrade to Pro" />

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
    ? LONG_DATE.format(new Date(summary.currentPeriodEnd))
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
        <StatusMessage tone="warning">
          Your last payment failed. Update your card to keep Pro.
        </StatusMessage>
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
      <StatusMessage tone="warning">
        Your Pro subscription is inactive because a payment didn&apos;t go through. Update your
        payment method to restore Pro.
      </StatusMessage>
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
