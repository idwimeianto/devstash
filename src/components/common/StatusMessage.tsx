import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  muted: "border-border bg-muted/40 text-muted-foreground",
};

interface StatusMessageProps {
  tone: keyof typeof TONE_CLASSES;
  children: ReactNode;
}

// Errors use role="alert" so screen readers announce them right away.
export function StatusMessage({ tone, children }: StatusMessageProps) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-md border px-3 py-2 text-sm", TONE_CLASSES[tone])}
    >
      {children}
    </p>
  );
}
