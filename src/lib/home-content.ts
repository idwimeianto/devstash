import { Folder, Search, type LucideIcon } from "lucide-react";

import { getItemTypeDisplay, getItemTypeLabel } from "@/lib/item-type-display";

// The homepage keeps the mockup's palette, which differs from the app's type colors.
export type HomeAccent = "snippet" | "prompt" | "command" | "note" | "file" | "image" | "link";

interface HomeAccentClasses {
  text: string;
  dot: string;
  tint: string;
  borderTop: string;
  hover: string;
}

// Static Tailwind classes, so they are picked up at build time.
export const HOME_ACCENTS: Record<HomeAccent, HomeAccentClasses> = {
  snippet: {
    text: "text-[#3b82f6]",
    dot: "bg-[#3b82f6]",
    tint: "bg-[#3b82f6]/15",
    borderTop: "border-t-[#3b82f6]",
    hover: "hover:border-[#3b82f6]/55 hover:shadow-[#3b82f6]/12",
  },
  prompt: {
    text: "text-[#f59e0b]",
    dot: "bg-[#f59e0b]",
    tint: "bg-[#f59e0b]/15",
    borderTop: "border-t-[#f59e0b]",
    hover: "hover:border-[#f59e0b]/55 hover:shadow-[#f59e0b]/12",
  },
  command: {
    text: "text-[#06b6d4]",
    dot: "bg-[#06b6d4]",
    tint: "bg-[#06b6d4]/15",
    borderTop: "border-t-[#06b6d4]",
    hover: "hover:border-[#06b6d4]/55 hover:shadow-[#06b6d4]/12",
  },
  note: {
    text: "text-[#22c55e]",
    dot: "bg-[#22c55e]",
    tint: "bg-[#22c55e]/15",
    borderTop: "border-t-[#22c55e]",
    hover: "hover:border-[#22c55e]/55 hover:shadow-[#22c55e]/12",
  },
  file: {
    text: "text-[#64748b]",
    dot: "bg-[#64748b]",
    tint: "bg-[#64748b]/15",
    borderTop: "border-t-[#64748b]",
    hover: "hover:border-[#64748b]/55 hover:shadow-[#64748b]/12",
  },
  image: {
    text: "text-[#ec4899]",
    dot: "bg-[#ec4899]",
    tint: "bg-[#ec4899]/15",
    borderTop: "border-t-[#ec4899]",
    hover: "hover:border-[#ec4899]/55 hover:shadow-[#ec4899]/12",
  },
  link: {
    text: "text-[#6366f1]",
    dot: "bg-[#6366f1]",
    tint: "bg-[#6366f1]/15",
    borderTop: "border-t-[#6366f1]",
    hover: "hover:border-[#6366f1]/55 hover:shadow-[#6366f1]/12",
  },
};

// ───────── Nav ─────────

export const HOME_NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

// ───────── Dashboard preview ─────────

const PREVIEW_TYPE_ORDER: HomeAccent[] = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

export const PREVIEW_TYPES = PREVIEW_TYPE_ORDER.map((type) => ({
  type,
  label: getItemTypeLabel(type),
}));

export const PREVIEW_CARDS: { title: string; type: HomeAccent }[] = [
  { title: "useAuth hook", type: "snippet" },
  { title: "Code review", type: "prompt" },
  { title: "git undo", type: "command" },
  { title: "Deploy notes", type: "note" },
  { title: "hero.png", type: "image" },
  { title: "Tailwind docs", type: "link" },
];

export function getHomeTypeIcon(type: HomeAccent): LucideIcon {
  return getItemTypeDisplay(type).icon;
}

// ───────── Features ─────────

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: HomeAccent;
}

export const FEATURES: Feature[] = [
  {
    title: "Code Snippets",
    description: "Store reusable code with syntax highlighting for every language you write.",
    icon: getHomeTypeIcon("snippet"),
    accent: "snippet",
  },
  {
    title: "AI Prompts",
    description:
      "Keep your best prompts, system messages and workflows instead of losing them in chat history.",
    icon: getHomeTypeIcon("prompt"),
    accent: "prompt",
  },
  {
    title: "Instant Search",
    description: "Search titles, content, tags and types from anywhere with a single shortcut.",
    icon: Search,
    accent: "link",
  },
  {
    title: "Commands",
    description:
      "That one-liner you needed last month? Save terminal commands and copy them in one click.",
    icon: getHomeTypeIcon("command"),
    accent: "command",
  },
  {
    title: "Files & Docs",
    description:
      "Upload context files, docs and images, and keep them next to the code they belong to.",
    icon: getHomeTypeIcon("file"),
    accent: "file",
  },
  {
    title: "Collections",
    description:
      "Group anything into collections. One item can live in as many collections as you need.",
    icon: Folder,
    accent: "note",
  },
];

// ───────── AI section ─────────

export const AI_CAPABILITIES = [
  "Auto-tag suggestions based on content",
  "Short summaries of long items",
  'Plain-language "Explain this code"',
  "Prompt optimizer for clearer prompts",
];

export const AI_TAGS = ["react", "hooks", "typescript", "debounce", "performance"];

// ───────── Pricing ─────────

export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;
export const PRO_MONTHLY_PRICE = 8;
export const PRO_YEARLY_PRICE = 72;

export type Billing = "monthly" | "yearly";

interface PlanPrice {
  price: string;
  period: string;
  note: string;
}

export function getYearlySavingsPercent(monthly: number, yearly: number): number {
  return Math.round((1 - yearly / (monthly * 12)) * 100);
}

export const YEARLY_SAVINGS_PERCENT = getYearlySavingsPercent(PRO_MONTHLY_PRICE, PRO_YEARLY_PRICE);

export function getProPlanPrice(billing: Billing): PlanPrice {
  if (billing === "yearly") {
    const perMonth = Number((PRO_YEARLY_PRICE / 12).toFixed(2));
    return {
      price: `$${PRO_YEARLY_PRICE}`,
      period: "/year",
      note: `Billed yearly. That's $${perMonth}/month, ${YEARLY_SAVINGS_PERCENT}% off.`,
    };
  }
  return { price: `$${PRO_MONTHLY_PRICE}`, period: "/month", note: "Billed monthly. Cancel anytime." };
}

export const FREE_PLAN_FEATURES = [
  `${FREE_ITEM_LIMIT} items`,
  `${FREE_COLLECTION_LIMIT} collections`,
  "Snippets, prompts, commands, notes & links",
  "Full-text search",
];

export const PRO_PLAN_FEATURES = [
  "Unlimited items & collections",
  "File & image uploads",
  "AI tags, summaries, explanations & prompt optimizer",
  "Export to JSON / ZIP",
  "Priority support",
];

// ───────── Footer ─────────

interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

// "#" marks pages that don't exist yet.
export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "AI", href: "#ai" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];
