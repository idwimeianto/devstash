import { Suspense } from "react";

import { NewItemDialog, type NewItemDialogProps } from "@/components/items/NewItemDialog";
import { getSessionUserId } from "@/lib/db/users";
import { checkUploadAllowed } from "@/lib/usage-checks";

type NewItemButtonProps = Omit<NewItemDialogProps, "canUpload">;

async function NewItemDialogForPlan(props: NewItemButtonProps) {
  const userId = await getSessionUserId();
  const canUpload = !userId || (await checkUploadAllowed(userId)) === null;
  return <NewItemDialog {...props} canUpload={canUpload} />;
}

// The New Item dialog with the user's plan applied. The plan is request-time data, so the
// unlocked dialog renders first; uploads are refused on the server either way.
export function NewItemButton(props: NewItemButtonProps) {
  return (
    <Suspense fallback={<NewItemDialog {...props} />}>
      <NewItemDialogForPlan {...props} />
    </Suspense>
  );
}
