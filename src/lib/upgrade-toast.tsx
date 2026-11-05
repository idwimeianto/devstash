import Link from "next/link";
import { toast } from "sonner";

import { UPGRADE_HREF } from "@/lib/usage-limits";

// Long enough to read the message and reach the button.
const UPGRADE_TOAST_DURATION_MS = 8000;

// A free-plan limit was hit: a red toast at the top center, where it can't be missed,
// with a link to the Billing card. Other toasts keep the default position and colors.
export function showUpgradeToast(message: string) {
  const id = toast.error(message, {
    position: "top-center",
    duration: UPGRADE_TOAST_DURATION_MS,
    // Important modifiers, since Sonner's own toast styles are more specific than utilities.
    classNames: {
      toast: "border-red-500! bg-red-600! text-white! shadow-lg shadow-red-950/40",
    },
    action: (
      <Link
        href={UPGRADE_HREF}
        onClick={() => toast.dismiss(id)}
        className="ml-auto inline-flex h-7 shrink-0 items-center rounded-md bg-white px-3 text-xs font-semibold text-red-700 transition-colors outline-none hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-white/70"
      >
        Upgrade
      </Link>
    ),
  });
}
