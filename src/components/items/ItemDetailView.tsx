import {
  CalendarDays,
  Copy,
  FolderOpen,
  Pencil,
  Pin,
  Star,
  Tag,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getItemTypeDisplay, getItemTypeLabel } from "@/lib/item-type-display";
import { getSafeHref } from "@/lib/safe-url";
import { cn } from "@/lib/utils";
import type { ItemDetailJson } from "@/types/items";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

interface ItemDetailViewProps {
  item: ItemDetailJson;
}

interface ItemDetailViewWithEditProps extends ItemDetailViewProps {
  onEdit: () => void;
}

export function ItemDetailView({ item, onEdit }: ItemDetailViewWithEditProps) {
  return (
    <>
      <ItemDrawerHeader item={item}>
        <ItemActionBar isFavorite={item.isFavorite} isPinned={item.isPinned} onEdit={onEdit} />
      </ItemDrawerHeader>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        {item.description && (
          <DetailSection title="Description">
            <p className="text-sm">{item.description}</p>
          </DetailSection>
        )}
        <ItemContent item={item} />
        {item.tags.length > 0 && (
          <DetailSection title="Tags" icon={Tag}>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </DetailSection>
        )}
        <ItemMetaSections item={item} />
      </div>
    </>
  );
}

interface ItemDrawerHeaderProps extends ItemDetailViewProps {
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
          <SheetTitle className="text-lg font-semibold break-words">{item.title}</SheetTitle>
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
export function ItemMetaSections({ item }: ItemDetailViewProps) {
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

interface ItemActionBarProps {
  isFavorite: boolean;
  isPinned: boolean;
  onEdit: () => void;
}

// Only Edit works so far; the other actions come with later item features.
function ItemActionBar({ isFavorite, isPinned, onEdit }: ItemActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={isFavorite}
        className={cn(isFavorite && "text-yellow-400")}
      >
        <Star className={cn(isFavorite && "fill-yellow-400")} />
        Favorite
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={isPinned}
        className={cn(!isPinned && "text-muted-foreground")}
      >
        <Pin className={cn(isPinned && "fill-current")} />
        Pin
      </Button>
      <Button variant="ghost" size="sm">
        <Copy />
        Copy
      </Button>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Delete item"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

function ItemContent({ item }: ItemDetailViewProps) {
  if (item.contentType === "URL") {
    const href = item.url && getSafeHref(item.url);
    return (
      <DetailSection title="URL">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm break-all text-primary underline-offset-4 hover:underline"
          >
            {item.url}
          </a>
        ) : (
          <p className="text-sm break-all">{item.url ?? "No URL"}</p>
        )}
      </DetailSection>
    );
  }

  if (item.contentType === "FILE") {
    return (
      <DetailSection title="File">
        <p className="text-sm break-all">{item.fileName ?? "No file"}</p>
      </DetailSection>
    );
  }

  return (
    <DetailSection title="Content">
      {item.content ? (
        <pre
          className={cn(
            "max-h-[28rem] overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed",
            // Code keeps its lines; prose such as prompts and notes wraps.
            !item.language && "whitespace-pre-wrap break-words"
          )}
        >
          <code>{item.content}</code>
        </pre>
      ) : (
        <p className="text-sm text-muted-foreground">No content</p>
      )}
    </DetailSection>
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
        <time dateTime={value}>{DATE_FORMAT.format(new Date(value))}</time>
      </dd>
    </>
  );
}
