import { Check, Layers } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HomeButtonVariant = "primary" | "outline" | "ghost";

const HOME_BUTTON_VARIANTS: Record<HomeButtonVariant, string> = {
  primary: cn(
    buttonVariants(),
    "bg-blue-500 text-white hover:bg-blue-600 [&_svg]:transition-transform hover:[&_svg]:translate-x-0.5",
  ),
  outline: cn(buttonVariants({ variant: "outline" }), "border-white/15 dark:border-white/15"),
  ghost: cn(buttonVariants({ variant: "ghost" }), "text-muted-foreground"),
};

const HOME_BUTTON_SIZES = {
  default: "h-9 gap-2 px-4",
  lg: "h-11 gap-2 px-5 text-[15px]",
};

// Homepage buttons use the snippet blue rather than the app's near-white primary.
export function homeButton(
  variant: HomeButtonVariant,
  size: keyof typeof HOME_BUTTON_SIZES = "default",
  className?: string,
): string {
  return cn(HOME_BUTTON_VARIANTS[variant], HOME_BUTTON_SIZES[size], className);
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-290 px-4 sm:px-6", className)}>{children}</div>;
}

export function GradientText({ children }: { children: ReactNode }) {
  return (
    <span className="bg-linear-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

export function Logo({ label }: { label?: string }) {
  return (
    <Link
      href="/"
      aria-label={label}
      className="inline-flex items-center gap-2.5 rounded-lg text-[17px] font-bold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <span className="grid size-7.5 place-items-center rounded-lg bg-linear-to-r from-blue-500 to-blue-400 text-white">
        <Layers className="size-4.5" />
      </span>
      DevStash
    </Link>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  lead?: string;
  className?: string;
}

export function SectionHeading({ eyebrow, title, lead, className }: SectionHeadingProps) {
  return (
    <header className={cn("mx-auto mb-14 max-w-160 text-center", className)}>
      {eyebrow && (
        <p className="mb-3 text-[13px] font-semibold tracking-widest text-blue-500 uppercase">
          {eyebrow}
        </p>
      )}
      <HomeH2>{title}</HomeH2>
      {lead && <HomeLead>{lead}</HomeLead>}
    </header>
  );
}

export function HomeH2({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[clamp(1.9rem,4vw,2.75rem)] leading-tight font-bold tracking-tight">
      {children}
    </h2>
  );
}

export function HomeLead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-4 text-base text-muted-foreground sm:text-lg", className)}>{children}</p>;
}

export function Checklist({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("grid gap-3", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-green-500/15 text-green-500">
            <Check className="size-3" strokeWidth={3} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

// Red / yellow / green window controls for the mockup frames.
export function WindowBar({ children }: { children?: ReactNode }) {
  return (
    <div className="flex h-8.5 items-center gap-1.5 border-b bg-zinc-900 px-3">
      <span className="size-2.5 rounded-full bg-red-500" />
      <span className="size-2.5 rounded-full bg-yellow-500" />
      <span className="size-2.5 rounded-full bg-green-500" />
      {children}
    </div>
  );
}
