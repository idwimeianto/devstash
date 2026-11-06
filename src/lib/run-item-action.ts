import { toast } from "sonner";

import { NETWORK_ERROR } from "@/lib/messages";
import { showUpgradeToast } from "@/lib/upgrade-toast";

type FieldErrors = Partial<Record<string, string[]>>;

export type ItemActionResult<T, F extends FieldErrors> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: F; upgradeRequired?: boolean };

interface RunItemActionOptions<F extends FieldErrors> {
  // No toast on success when left out, e.g. when the result itself appears on screen.
  successMessage?: string;
  onFieldErrors?: (fieldErrors: F) => void;
}

// Runs an item form's server action with the shared toasts: success, the action's error
// (with its field errors handed back for inline display; a free-plan limit gets the upgrade
// toast instead), or a failure to reach the server.
// Returns the action's data, or null when it didn't succeed.
export async function runItemAction<T, F extends FieldErrors>(
  action: () => Promise<ItemActionResult<T, F>>,
  { successMessage, onFieldErrors }: RunItemActionOptions<F> = {},
): Promise<T | null> {
  let result: ItemActionResult<T, F>;
  try {
    result = await action();
  } catch {
    toast.error(NETWORK_ERROR);
    return null;
  }

  if (!result.success) {
    onFieldErrors?.(result.fieldErrors ?? ({} as F));
    if (result.upgradeRequired) {
      showUpgradeToast(result.error);
    } else {
      toast.error(result.error);
    }
    return null;
  }
  if (successMessage) toast.success(successMessage);
  return result.data;
}
