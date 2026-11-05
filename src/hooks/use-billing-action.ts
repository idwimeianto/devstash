"use client";

import { unstable_rethrow } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { NETWORK_ERROR } from "@/lib/messages";
import type { BillingActionResult } from "@/types/billing";

// Runs a billing action that redirects to Stripe on success, so only failures come back.
export function useBillingAction() {
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
