"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { startCheckout } from "@/actions/billing";
import { BillingOptionPicker } from "@/components/billing/BillingOptionPicker";
import { StatusMessage } from "@/components/common/StatusMessage";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBillingAction } from "@/hooks/use-billing-action";
import { FREE_PLAN_FEATURES, getProPlanPrice, PRO_PLAN_FEATURES } from "@/lib/home-content";
import type { Billing } from "@/lib/usage-limits";
import { cn } from "@/lib/utils";
import type { UpgradeStatus } from "@/types/billing";

const BILLING_HREF = "/settings#billing";

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2.5 text-sm">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
          {item}
        </li>
      ))}
    </ul>
  );
}

interface PlanCardProps {
  name: string;
  price: ReactNode;
  features: string[];
  children: ReactNode;
  highlighted?: boolean;
}

function PlanCard({ name, price, features, children, highlighted = false }: PlanCardProps) {
  return (
    <Card
      className={cn(
        "gap-0 p-6",
        highlighted &&
          "bg-linear-to-b from-blue-500/8 to-card to-40% ring-blue-500/50 shadow-xl shadow-blue-500/10",
      )}
    >
      <h2 className="text-lg font-semibold">{name}</h2>
      {price}
      <div className="mt-6 mb-6 flex-1">
        <FeatureList items={features} />
      </div>
      {children}
    </Card>
  );
}

function Price({ price, period, note }: { price: string; period: string; note: string }) {
  return (
    <>
      <p className="mt-3 flex items-baseline gap-1">
        <strong className="text-4xl leading-none font-bold tracking-tight">{price}</strong>
        <span className="text-muted-foreground">{period}</span>
      </p>
      <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
        {note}
      </p>
    </>
  );
}

function CheckoutForm({ billing, onBillingChange }: { billing: Billing; onBillingChange: (billing: Billing) => void }) {
  const { pending, run } = useBillingAction();

  return (
    <div className="grid gap-4">
      <BillingOptionPicker
        value={billing}
        onChange={onBillingChange}
        legend="Billing period"
        className="sm:grid-cols-1"
      />
      <Button
        size="lg"
        className="w-full bg-blue-500 text-white hover:bg-blue-500/90"
        disabled={pending}
        onClick={() => run(() => startCheckout(billing))}
      >
        {pending && <Loader2 className="animate-spin" />}
        Upgrade to Pro
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Secure checkout with Stripe. Cancel anytime from Billing.
      </p>
    </div>
  );
}

function ProPlanAction({
  status,
  billing,
  onBillingChange,
}: {
  status: UpgradeStatus;
  billing: Billing;
  onBillingChange: (billing: Billing) => void;
}) {
  if (status === "free") return <CheckoutForm billing={billing} onBillingChange={onBillingChange} />;

  return (
    <div className="grid gap-3">
      <StatusMessage tone={status === "pro" ? "success" : "warning"}>
        {status === "pro"
          ? "You're already on Pro."
          : "Your Pro subscription is inactive because a payment didn't go through. Update your payment method in Billing to restore Pro."}
      </StatusMessage>
      <Link href={BILLING_HREF} className={buttonVariants({ variant: "outline", className: "w-full" })}>
        Manage billing
      </Link>
    </div>
  );
}

export function UpgradePlans({ status }: { status: UpgradeStatus }) {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PlanCard
        name="Free"
        price={<Price price="$0" period="/forever" note="For trying DevStash out." />}
        features={FREE_PLAN_FEATURES}
      >
        <span
          aria-disabled="true"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "pointer-events-none w-full opacity-60",
          })}
        >
          {status === "pro" ? "Included" : "Current plan"}
        </span>
      </PlanCard>
      <PlanCard
        name="Pro"
        price={<Price {...getProPlanPrice(billing)} />}
        features={PRO_PLAN_FEATURES}
        highlighted
      >
        <ProPlanAction status={status} billing={billing} onBillingChange={setBilling} />
      </PlanCard>
    </div>
  );
}
