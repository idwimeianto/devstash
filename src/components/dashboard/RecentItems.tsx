import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { NewItemButton } from "@/components/items/NewItemButton";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecentItems } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/users";

const LIST_CLASSES = "flex flex-col gap-3";
const SKELETON_COUNT = 5;

export async function RecentItems() {
  const userId = await getCurrentUserId();
  const items = await getRecentItems(userId);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        message="No items yet. Add one to start building your stash."
        action={<NewItemButton />}
      />
    );
  }

  return (
    <div className={LIST_CLASSES}>
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export function RecentItemsSkeleton() {
  return (
    <div className={LIST_CLASSES}>
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <Skeleton key={i} className="h-[5.5rem] rounded-xl" />
      ))}
    </div>
  );
}
