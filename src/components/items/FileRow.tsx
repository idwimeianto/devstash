import { Download } from "lucide-react";
import { createElement } from "react";

import { ItemMarkers } from "@/components/items/ItemMarkers";
import { OpenItemButton } from "@/components/items/OpenItemButton";
import { buttonVariants } from "@/components/ui/button";
import { getFileIcon } from "@/lib/file-icons";
import { formatFileSize } from "@/lib/file-upload";
import { getItemTypeDisplay } from "@/lib/item-type-display";
import { cn } from "@/lib/utils";
import type { ItemSummary } from "@/types/items";

const UPLOAD_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

interface FileRowProps {
  item: ItemSummary;
}

export function FileRow({ item }: FileRowProps) {
  const { textColor, bgTint } = getItemTypeDisplay(item.typeName);
  const size = item.fileSize !== null ? formatFileSize(item.fileSize) : null;
  const uploaded = (
    <time dateTime={item.createdAt.toISOString()}>
      {UPLOAD_DATE_FORMAT.format(item.createdAt)}
    </time>
  );

  return (
    <li className="relative flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-inset">
      <OpenItemButton itemId={item.id} title={item.title} />
      <div
        className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", bgTint)}
      >
        {/* The icon is a static lucide component picked by extension. */}
        {createElement(getFileIcon(item.fileName), {
          className: cn("size-5", textColor),
          "aria-hidden": true,
        })}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{item.title}</h3>
          <ItemMarkers isPinned={item.isPinned} isFavorite={item.isFavorite} />
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {item.fileName ?? "Untitled file"}
        </p>
        {/* Size and date stack under the name on small screens. */}
        <p className="text-xs text-muted-foreground sm:hidden">
          {size && <>{size} · </>}
          {uploaded}
        </p>
      </div>
      <span className="hidden w-20 shrink-0 text-right text-sm text-muted-foreground sm:block">
        {size}
      </span>
      <span className="hidden w-28 shrink-0 text-right text-sm text-muted-foreground sm:block">
        {uploaded}
      </span>
      {item.fileUrl && (
        // Above the row's open button, so a click downloads instead of opening the drawer.
        <a
          href={`/api/items/${encodeURIComponent(item.id)}/download`}
          download
          aria-label={`Download ${item.fileName ?? item.title}`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative z-20 shrink-0")}
        >
          <Download />
        </a>
      )}
    </li>
  );
}
