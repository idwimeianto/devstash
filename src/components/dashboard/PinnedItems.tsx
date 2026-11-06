import { Pin } from "lucide-react";

import { ItemCard } from "@/components/dashboard/ItemCard";
import { getPinnedItems } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/users";

export async function PinnedItems() {
  const userId = await getCurrentUserId();
  const items = await getPinnedItems(userId);

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <Pin className="size-5 text-muted-foreground" />
        Pinned
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
