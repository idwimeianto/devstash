import { getSessionUserId } from "@/lib/db/users";
import { checkAiAllowed } from "@/lib/usage-checks";

// Whether the forms show AI buttons. A failed lookup only hides them, rather than taking the
// page down; the server action does the real check.
export async function getSessionCanUseAi(): Promise<boolean> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return false;
    return (await checkAiAllowed(userId)) === null;
  } catch (error) {
    console.error("Checking AI access failed", error);
    return false;
  }
}
