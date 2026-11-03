import { CollectionGrid } from "@/components/collections/CollectionGrid";
import { getRecentCollections } from "@/lib/db/collections";
import { getCurrentUserId } from "@/lib/db/users";

export async function RecentCollections() {
  const userId = await getCurrentUserId();
  const collections = await getRecentCollections(userId);
  return <CollectionGrid collections={collections} />;
}
