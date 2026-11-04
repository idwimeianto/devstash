import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { NETWORK_ERROR } from "@/lib/messages";
import type { SetFavoriteResult } from "@/types/favorites";

// Flips the star at once, saves in the background, and rolls back with an error toast if the
// save fails. On success the page refreshes so the sidebar, stats and /favorites follow.
export function useFavoriteToggle(
  saved: boolean,
  save: (isFavorite: boolean) => Promise<SetFavoriteResult>,
) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(saved);
  const [previousSaved, setPreviousSaved] = useState(saved);

  // Follow the server's value when it changes, e.g. after a toggle elsewhere and a refresh.
  if (saved !== previousSaved) {
    setPreviousSaved(saved);
    setIsFavorite(saved);
  }

  async function toggle() {
    const next = !isFavorite;
    setIsFavorite(next);

    let result: SetFavoriteResult;
    try {
      result = await save(next);
    } catch {
      result = { success: false, error: NETWORK_ERROR };
    }

    if (!result.success) {
      setIsFavorite(!next);
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return { isFavorite, toggle };
}
