import { CalendarDays, FolderOpen, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LONG_DATE } from "@/lib/format-date";
import { getItemTypeDisplay, getItemTypeLabel } from "@/lib/item-type-display";
import { cn } from "@/lib/utils";
import type { ItemDetailJson } from "@/types/items";

// Building blocks the item drawer's view mode and edit form share.

interface ItemProps {
  item: ItemDetailJson;
}

interface ItemDrawerHeaderProps extends ItemProps {
  children: React.ReactNode;
}

// Type icon, title and badges, with the mode's actions below.
export function ItemDrawerHeader({ item, children }: ItemDrawerHeaderProps) {
  const { icon: Icon, textColor, bgTint } = getItemTypeDisplay(item.typeName);

  return (
    <SheetHeader className="gap-5 border-b p-6">
      {/* Right padding keeps the title clear of the sheet's close button. */}
      <div className="flex items-start gap-4 pr-6">
        <div
          className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", bgTint)}
        >
          <Icon className={cn("size-6", textColor)} />
        </div>
        <div className="min-w-0">
          <SheetTitle className="text-xl font-semibold break-words">{item.title}</SheetTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{getItemTypeLabel(item.typeName)}</Badge>
            {item.language && <Badge variant="outline">{item.language}</Badge>}
          </div>
        </div>
      </div>
      {children}
    </SheetHeader>
  );
}

// Collections and dates, which are shown but not editable in both modes.
export function ItemMetaSections({ item }: ItemProps) {
  return (
    <>
      {item.collections.length > 0 && (
        <DetailSection title="Collections" icon={FolderOpen}>
          <div className="flex flex-wrap gap-1.5">
            {item.collections.map((collection) => (
              <Badge key={collection.id} variant="outline">
                {collection.name}
              </Badge>
            ))}
          </div>
        </DetailSection>
      )}
      <DetailSection title="Details" icon={CalendarDays}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <DetailDate label="Created" value={item.createdAt} />
          <DetailDate label="Updated" value={item.updatedAt} />
        </dl>
      </DetailSection>
    </>
  );
}

interface DetailSectionProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function DetailSection({ title, icon: Icon, children }: DetailSectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {Icon && <Icon className="size-4" />}
        {title}
      </h3>
      {children}
    </section>
  );
}

interface DetailDateProps {
  label: string;
  value: string;
}

function DetailDate({ label, value }: DetailDateProps) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">
        <time dateTime={value}>{LONG_DATE.format(new Date(value))}</time>
      </dd>
    </>
  );
}
