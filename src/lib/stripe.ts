import Stripe from "stripe";

import type { Billing } from "@/lib/usage-limits";

// Created on first use so builds and tests don't need the env.
let client: Stripe | undefined;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

// No apiVersion: the SDK pins the version its types were built for.
export function getStripe(): Stripe {
  client ??= new Stripe(requireEnv("STRIPE_SECRET_KEY"));
  return client;
}

export function getWebhookSecret(): string {
  return requireEnv("STRIPE_WEBHOOK_SECRET");
}

export function getPriceId(billing: Billing): string {
  return requireEnv(billing === "yearly" ? "STRIPE_PRICE_ID_YEARLY" : "STRIPE_PRICE_ID_MONTHLY");
}
