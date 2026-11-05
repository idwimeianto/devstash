import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
import { getUserPlan } from "@/lib/db/billing";
import { getSessionUserId } from "@/lib/db/users";
import { UPGRADE_HREF } from "@/lib/usage-limits";

async function UpgradeLink() {
  const userId = await getSessionUserId();
  if (!userId || (await getUserPlan(userId)).isPro) return null;

  return (
    <Link
      href={UPGRADE_HREF}
      aria-label="Upgrade to Pro"
      className={buttonVariants({ variant: "ghost", className: "text-muted-foreground" })}
    >
      <Sparkles />
      <span className="hidden sm:inline">Upgrade</span>
    </Link>
  );
}

// A subtle top bar link for free users. The plan is request-time data, so nothing renders
// until it's known, and Pro users never see it flash.
export function UpgradeButton() {
  return (
    <Suspense fallback={null}>
      <UpgradeLink />
    </Suspense>
  );
}
