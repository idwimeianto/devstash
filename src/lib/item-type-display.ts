import {
  Code,
  File,
  Image,
  Link,
  Sparkles,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";

interface ItemTypeDisplay {
  icon: LucideIcon;
  textColor: string;
}

// Static Tailwind classes for the system type colors, so they are picked up at build time.
const ITEM_TYPE_DISPLAY: Record<string, ItemTypeDisplay> = {
  snippet: { icon: Code, textColor: "text-[#3b82f6]" },
  prompt: { icon: Sparkles, textColor: "text-[#8b5cf6]" },
  note: { icon: StickyNote, textColor: "text-[#fde047]" },
  command: { icon: Terminal, textColor: "text-[#f97316]" },
  link: { icon: Link, textColor: "text-[#10b981]" },
  file: { icon: File, textColor: "text-[#6b7280]" },
  image: { icon: Image, textColor: "text-[#ec4899]" },
};

const FALLBACK_DISPLAY: ItemTypeDisplay = {
  icon: File,
  textColor: "text-muted-foreground",
};

export function getItemTypeDisplay(typeName: string): ItemTypeDisplay {
  return ITEM_TYPE_DISPLAY[typeName] ?? FALLBACK_DISPLAY;
}

export function getItemTypeLabel(typeName: string): string {
  return `${typeName.charAt(0).toUpperCase()}${typeName.slice(1)}s`;
}

export function getItemTypeHref(typeName: string): string {
  return `/items/${typeName}s`;
}
