import { FolderHeart, Folders, Heart, Layers, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCollectionStats } from "@/lib/db/collections";
import { getItemStats } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/users";

const GRID_CLASSES = "grid grid-cols-2 gap-4 lg:grid-cols-4";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
}

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export async function StatsCards() {
  const userId = await getCurrentUserId();
  const [collectionStats, itemStats] = await Promise.all([
    getCollectionStats(userId),
    getItemStats(userId),
  ]);

  return (
    <div className={GRID_CLASSES}>
      <StatCard label="Items" value={itemStats.items} icon={Layers} />
      <StatCard
        label="Collections"
        value={collectionStats.collections}
        icon={Folders}
      />
      <StatCard
        label="Favorite Items"
        value={itemStats.favoriteItems}
        icon={Heart}
      />
      <StatCard
        label="Favorite Collections"
        value={collectionStats.favoriteCollections}
        icon={FolderHeart}
      />
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className={GRID_CLASSES}>
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
      ))}
    </div>
  );
}
