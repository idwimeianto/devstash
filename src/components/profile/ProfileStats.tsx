import { Folders, Layers, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getItemTypeDisplay, getItemTypeLabel } from "@/lib/item-type-display";
import { cn } from "@/lib/utils";
import type { ItemTypeWithCount } from "@/types/items";

interface ProfileStatsProps {
  items: number;
  collections: number;
  types: ItemTypeWithCount[];
}

interface TotalProps {
  label: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
}

function Total({ label, value, icon: Icon, iconColor }: TotalProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <div className={cn("flex size-10 items-center justify-center rounded-lg", iconColor)}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function ProfileStats({ items, collections, types }: ProfileStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Total
            label="Total items"
            value={items}
            icon={Layers}
            iconColor="bg-blue-500/10 text-blue-500"
          />
          <Total
            label="Total collections"
            value={collections}
            icon={Folders}
            iconColor="bg-emerald-500/10 text-emerald-500"
          />
        </div>

        <div className="grid gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">Items by type</h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {types.map((type) => {
              const { icon: Icon, textColor, bgTint } = getItemTypeDisplay(type.name);
              return (
                <li
                  key={type.id}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2"
                >
                  <span
                    className={cn("flex size-7 items-center justify-center rounded-md", bgTint)}
                  >
                    <Icon className={cn("size-4", textColor)} />
                  </span>
                  <span className="flex-1 truncate text-sm">{getItemTypeLabel(type.name)}</span>
                  <span className="text-sm font-semibold tabular-nums">{type.itemCount}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
