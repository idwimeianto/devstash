import { Suspense } from "react";

import { CommandPalette } from "@/components/search/CommandPalette";
import { getAllCollections } from "@/lib/db/collections";
import { getSearchItems } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/users";

async function LoadedCommandPalette() {
  const userId = await getCurrentUserId();
  const [items, collections] = await Promise.all([
    getSearchItems(userId),
    getAllCollections(userId),
  ]);

  return (
    <CommandPalette
      data={{
        items,
        collections: collections.map(({ id, name, itemCount }) => ({ id, name, itemCount })),
      }}
    />
  );
}

// Loads the searchable items and collections with the page, so typing never waits on the server.
export function GlobalSearch() {
  return (
    <Suspense fallback={<CommandPalette data={null} />}>
      <LoadedCommandPalette />
    </Suspense>
  );
}
