"use client";

import { Copy, Download, FileText, Pencil, Pin, Star, Tag } from "lucide-react";

import { setItemFavorite, setItemPinned } from "@/actions/items";
import { ExplainableCodeEditor } from "@/components/ai/ExplainableCodeEditor";
import { DeleteItemDialog } from "@/components/items/DeleteItemDialog";
import {
  DetailSection,
  ItemDrawerHeader,
  ItemMetaSections,
} from "@/components/items/ItemDrawerParts";
import { MarkdownEditor } from "@/components/markdown/MarkdownEditor";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useOptimisticToggle } from "@/hooks/use-optimistic-toggle";
import { formatFileSize } from "@/lib/file-upload";
import { isCodeItemType, isMarkdownItemType } from "@/lib/item-fields";
import { getSafeHref } from "@/lib/safe-url";
import { cn } from "@/lib/utils";
import type { ItemDetailJson } from "@/types/items";

interface ItemDetailViewProps {
  item: ItemDetailJson;
}

interface ItemDetailViewWithActionsProps extends ItemDetailViewProps {
  onEdit: () => void;
  onDeleted: () => void;
  // Keep the drawer's copy of the item in step, so switching to edit and back shows it.
  onFavoriteSaved: (isFavorite: boolean) => void;
  onPinnedSaved: (isPinned: boolean) => void;
}

export function ItemDetailView({
  item,
  onEdit,
  onDeleted,
  onFavoriteSaved,
  onPinnedSaved,
}: ItemDetailViewWithActionsProps) {
  return (
    <>
      <ItemDrawerHeader item={item}>
        <ItemActionBar
          item={item}
          onEdit={onEdit}
          onDeleted={onDeleted}
          onFavoriteSaved={onFavoriteSaved}
          onPinnedSaved={onPinnedSaved}
        />
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

// Favorite, Pin, Edit and Delete work so far; Copy comes with a later item feature.
function ItemActionBar({
  item,
  onEdit,
  onDeleted,
  onFavoriteSaved,
  onPinnedSaved,
}: ItemDetailViewWithActionsProps) {
  const favorite = useOptimisticToggle(item.isFavorite, async (next) => {
    const result = await setItemFavorite(item.id, next);
    if (result.success) onFavoriteSaved(next);
    return result;
  });
  const pin = useOptimisticToggle(item.isPinned, async (next) => {
    const result = await setItemPinned(item.id, next);
    if (result.success) onPinnedSaved(next);
    return result;
  });
  const isFavorite = favorite.checked;
  const isPinned = pin.checked;
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={isFavorite}
        className={cn(isFavorite && "text-yellow-400")}
        onClick={favorite.toggle}
      >
        <Star className={cn(isFavorite && "fill-yellow-400")} />
        Favorite
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={isPinned}
        className={cn(!isPinned && "text-muted-foreground")}
        onClick={pin.toggle}
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
        <ExplainableCodeEditor
          title={item.title}
          value={item.content}
          language={item.language}
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
