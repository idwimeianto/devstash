"use client";

import { getProPlanPrice, YEARLY_SAVINGS_PERCENT } from "@/lib/home-content";
import { BILLING_OPTIONS, type Billing } from "@/lib/usage-limits";
import { cn } from "@/lib/utils";

export const BILLING_LABELS: Record<Billing, string> = { monthly: "Monthly", yearly: "Yearly" };

interface BillingOptionPickerProps {
  value: Billing;
  onChange: (billing: Billing) => void;
  legend: string;
  legendClassName?: string;
  className?: string;
}

// Monthly / yearly Pro radio cards with their prices.
export function BillingOptionPicker({
  value,
  onChange,
  legend,
  legendClassName,
  className,
}: BillingOptionPickerProps) {
  return (
    <fieldset className={cn("grid gap-2 sm:grid-cols-2", className)}>
      <legend className={cn("mb-2 text-sm font-medium", legendClassName)}>{legend}</legend>
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
              checked={value === option}
              onChange={() => onChange(option)}
              className="mt-1 accent-blue-500"
            />
            <span className="grid gap-0.5">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                <span>
                  {BILLING_LABELS[option]} · {price}
                  <span className="font-normal text-muted-foreground">{period}</span>
                </span>
                {option === "yearly" && (
                  <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-400">
                    Save {YEARLY_SAVINGS_PERCENT}%
                  </span>
                )}
              </span>
              <span className="text-xs text-muted-foreground">{note}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
