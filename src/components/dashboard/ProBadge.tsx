import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// The small "PRO" label used for Pro item types, Pro accounts and the Pro plan.
export function ProBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-4 px-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground",
        className,
      )}
    >
      PRO
    </Badge>
  );
}
