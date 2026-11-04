import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { NETWORK_ERROR } from "@/lib/messages";

type ToggleResult = { success: true } | { success: false; error: string };

// Flips a saved on / off value (favorite, pin) at once, saves in the background, and rolls
// back with an error toast if the save fails. On success the page refreshes so the sidebar,
// stats and listings follow.
export function useOptimisticToggle(
  saved: boolean,
  save: (next: boolean) => Promise<ToggleResult>,
) {
  const router = useRouter();
  const [checked, setChecked] = useState(saved);
  const [previousSaved, setPreviousSaved] = useState(saved);

  // Follow the server's value when it changes, e.g. after a toggle elsewhere and a refresh.
  if (saved !== previousSaved) {
    setPreviousSaved(saved);
    setChecked(saved);
  }

  async function toggle() {
    const next = !checked;
    setChecked(next);

    let result: ToggleResult;
    try {
      result = await save(next);
    } catch {
      result = { success: false, error: NETWORK_ERROR };
    }

    if (!result.success) {
      setChecked(!next);
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return { checked, toggle };
}
