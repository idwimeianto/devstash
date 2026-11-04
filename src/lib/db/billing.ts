import { cache } from "react";

import { prisma } from "@/lib/prisma";
import type { PlanUser } from "@/lib/usage-limits";
import type { SubscriptionState, UserBilling } from "@/types/billing";

// Read from the database rather than the session, so enforcement never uses a stale JWT.
// A missing user counts as free.
export const getUserPlan = cache(async (userId: string): Promise<PlanUser> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPro: true } });
  return { isPro: user?.isPro ?? false };
});

export async function getUserBilling(userId: string): Promise<UserBilling | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });
}

export async function setStripeCustomerId(userId: string, customerId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
}

// False when no user has this customer id (e.g. the account was deleted).
export async function syncSubscription(
  customerId: string,
  state: SubscriptionState,
): Promise<boolean> {
  const { count } = await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: state,
  });
  return count > 0;
}

export async function countUserItems(userId: string): Promise<number> {
  return prisma.item.count({ where: { userId } });
}

export async function countUserCollections(userId: string): Promise<number> {
  return prisma.collection.count({ where: { userId } });
}
