import { FolderHeart, Folders, Heart, Layers, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/dashboard";

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

export function StatsCards() {
  const stats = getDashboardStats();

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Items" value={stats.items} icon={Layers} />
      <StatCard label="Collections" value={stats.collections} icon={Folders} />
      <StatCard label="Favorite Items" value={stats.favoriteItems} icon={Heart} />
      <StatCard
        label="Favorite Collections"
        value={stats.favoriteCollections}
        icon={FolderHeart}
      />
    </div>
  );
}
