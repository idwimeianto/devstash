import { Layers } from "lucide-react";

import { cn } from "@/lib/utils";

// The app's logo mark, in one color everywhere; the size comes from the caller.
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg bg-linear-to-r from-blue-500 to-blue-400 text-white",
        className,
      )}
    >
      <Layers className="size-4" />
    </span>
  );
}
