"use client";

import { createContext, use, useState, type ReactNode } from "react";

import { Switch } from "@/components/ui/switch";
import { getProPlanPrice, YEARLY_SAVINGS_PERCENT, type Billing } from "@/lib/home-content";
import { cn } from "@/lib/utils";

const BillingContext = createContext<Billing>("monthly");

function BillingOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        active ? "text-foreground" : "text-zinc-500 hover:text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

// The monthly / yearly switch; the plan cards below it read the choice through `ProPrice`.
export function BillingToggle({ children }: { children: ReactNode }) {
  const [billing, setBilling] = useState<Billing>("monthly");
  const yearly = billing === "yearly";

  return (
    <BillingContext value={billing}>
      <div className="mt-7 flex items-center justify-center gap-3 text-sm">
        <BillingOption active={!yearly} onClick={() => setBilling("monthly")}>
          Monthly
        </BillingOption>
        <Switch
          checked={yearly}
          onCheckedChange={(checked) => setBilling(checked ? "yearly" : "monthly")}
          aria-label="Bill yearly"
          className="data-checked:bg-blue-500"
        />
        <BillingOption active={yearly} onClick={() => setBilling("yearly")}>
          Yearly
          <span className="ml-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-500">
            Save {YEARLY_SAVINGS_PERCENT}%
          </span>
        </BillingOption>
      </div>
      {children}
    </BillingContext>
  );
}

export function ProPrice() {
  const { price, period, note } = getProPlanPrice(use(BillingContext));

  return (
    <>
      <p className="mt-4 flex items-baseline gap-1">
        <strong className="text-5xl leading-none font-bold tracking-tight">{price}</strong>
        <span className="text-muted-foreground">{period}</span>
      </p>
      <p className="mt-2 text-sm text-zinc-500" aria-live="polite">
        {note}
      </p>
    </>
  );
}
