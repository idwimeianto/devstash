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
  bgColor: string;
  borderColor: string;
  bgTint: string;
}

// Static Tailwind classes for the system type colors, so they are picked up at build time.
const ITEM_TYPE_DISPLAY: Record<string, ItemTypeDisplay> = {
  snippet: {
    icon: Code,
    textColor: "text-[#3b82f6]",
    bgColor: "bg-[#3b82f6]",
    borderColor: "border-l-[#3b82f6]",
    bgTint: "bg-[#3b82f6]/10",
  },
  prompt: {
    icon: Sparkles,
    textColor: "text-[#8b5cf6]",
    bgColor: "bg-[#8b5cf6]",
    borderColor: "border-l-[#8b5cf6]",
    bgTint: "bg-[#8b5cf6]/10",
  },
  note: {
    icon: StickyNote,
    textColor: "text-[#fde047]",
    bgColor: "bg-[#fde047]",
    borderColor: "border-l-[#fde047]",
    bgTint: "bg-[#fde047]/10",
  },
  command: {
    icon: Terminal,
    textColor: "text-[#f97316]",
    bgColor: "bg-[#f97316]",
    borderColor: "border-l-[#f97316]",
    bgTint: "bg-[#f97316]/10",
  },
  link: {
    icon: Link,
    textColor: "text-[#10b981]",
    bgColor: "bg-[#10b981]",
    borderColor: "border-l-[#10b981]",
    bgTint: "bg-[#10b981]/10",
  },
  file: {
    icon: File,
    textColor: "text-[#6b7280]",
    bgColor: "bg-[#6b7280]",
    borderColor: "border-l-[#6b7280]",
    bgTint: "bg-[#6b7280]/10",
  },
  image: {
    icon: Image,
    textColor: "text-[#ec4899]",
    bgColor: "bg-[#ec4899]",
    borderColor: "border-l-[#ec4899]",
    bgTint: "bg-[#ec4899]/10",
  },
};

const FALLBACK_DISPLAY: ItemTypeDisplay = {
  icon: File,
  textColor: "text-muted-foreground",
  bgColor: "bg-muted-foreground",
  borderColor: "border-l-border",
  bgTint: "bg-muted",
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
