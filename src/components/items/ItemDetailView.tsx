import {
  CalendarDays,
  Copy,
  Download,
  FileText,
  FolderOpen,
  Pencil,
  Pin,
  Star,
  Tag,
  type LucideIcon,
} from "lucide-react";

import { CodeEditor } from "@/components/code/CodeEditor";
import { DeleteItemDialog } from "@/components/items/DeleteItemDialog";
import { MarkdownEditor } from "@/components/markdown/MarkdownEditor";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatFileSize } from "@/lib/file-upload";
import { isCodeItemType, isMarkdownItemType } from "@/lib/item-fields";
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

interface ItemDetailViewWithActionsProps extends ItemDetailViewProps {
  onEdit: () => void;
  onDeleted: () => void;
}

export function ItemDetailView({ item, onEdit, onDeleted }: ItemDetailViewWithActionsProps) {
  return (
    <>
      <ItemDrawerHeader item={item}>
        <ItemActionBar item={item} onEdit={onEdit} onDeleted={onDeleted} />
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

// Only Edit and Delete work so far; the other actions come with later item features.
function ItemActionBar({ item, onEdit, onDeleted }: ItemDetailViewWithActionsProps) {
  const { isFavorite, isPinned } = item;
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
        <DeleteItemDialog itemId={item.id} itemTitle={item.title} onDeleted={onDeleted} />
      </div>
    </div>
  );
}

// Image preview or file info, with a download through the app's proxy route.
function ItemFile({ item }: ItemDetailViewProps) {
  const isImage = item.typeName === "image";
  const previewSrc = isImage && item.fileUrl ? getSafeHref(item.fileUrl) : null;

  if (!item.fileUrl) {
    return (
      <DetailSection title={isImage ? "Image" : "File"}>
        <p className="text-sm text-muted-foreground">No file</p>
      </DetailSection>
    );
  }

  return (
    <DetailSection title={isImage ? "Image" : "File"}>
      <div className="overflow-hidden rounded-lg border">
        {previewSrc && (
          // eslint-disable-next-line @next/next/no-img-element -- user uploads on the R2 public domain
          <img
            src={previewSrc}
            alt={item.title}
            className="max-h-80 w-full border-b bg-muted/40 object-contain"
          />
        )}
        <div className="flex items-center gap-3 p-3">
          {!isImage && (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.fileName ?? "Untitled file"}</p>
            {item.fileSize !== null && (
              <p className="text-xs text-muted-foreground">{formatFileSize(item.fileSize)}</p>
            )}
          </div>
          {/* A plain link: Base UI's Button would add role="button" to it. */}
          <a
            href={`/api/items/${encodeURIComponent(item.id)}/download`}
            download
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Download />
            Download
          </a>
        </div>
      </div>
    </DetailSection>
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
    return <ItemFile item={item} />;
  }

  if (item.content && isCodeItemType(item.typeName)) {
    return (
      <DetailSection title="Content">
        <CodeEditor
          value={item.content}
          language={item.language}
          readOnly
          ariaLabel={`${item.title} content`}
        />
      </DetailSection>
    );
  }

  if (item.content && isMarkdownItemType(item.typeName)) {
    return (
      <DetailSection title="Content">
        <MarkdownEditor value={item.content} readOnly ariaLabel={`${item.title} content`} />
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
