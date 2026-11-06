import { countUserCollections, countUserItems, getUserPlan } from "@/lib/db/billing";
import { isUploadKind } from "@/lib/file-upload";
import {
  AI_PRO_REQUIRED,
  canCreateCollection,
  canCreateItem,
  canUse,
  COLLECTION_LIMIT_REACHED,
  isProGatingEnabled,
  ITEM_LIMIT_REACHED,
  PRO_FEATURE_REQUIRED,
} from "@/lib/usage-limits";

// Server-side plan checks. Each returns the message to show, or null when allowed. Nothing is
// queried while gating is off, and items / collections are counted only for free users.

export async function checkUploadAllowed(userId: string): Promise<string | null> {
  if (!isProGatingEnabled()) return null;
  return canUse("uploads", await getUserPlan(userId)) ? null : PRO_FEATURE_REQUIRED;
}

export async function checkAiAllowed(userId: string): Promise<string | null> {
  if (!isProGatingEnabled()) return null;
  return canUse("ai", await getUserPlan(userId)) ? null : AI_PRO_REQUIRED;
}

export async function checkItemCreation(userId: string, typeName: string): Promise<string | null> {
  if (!isProGatingEnabled()) return null;

  const plan = await getUserPlan(userId);
  if (plan.isPro) return null;
  if (isUploadKind(typeName) && !canUse("uploads", plan)) return PRO_FEATURE_REQUIRED;
  return canCreateItem(plan, await countUserItems(userId)) ? null : ITEM_LIMIT_REACHED;
}

export async function checkCollectionCreation(userId: string): Promise<string | null> {
  if (!isProGatingEnabled()) return null;

  const plan = await getUserPlan(userId);
  if (plan.isPro) return null;
  return canCreateCollection(plan, await countUserCollections(userId))
    ? null
    : COLLECTION_LIMIT_REACHED;
}
