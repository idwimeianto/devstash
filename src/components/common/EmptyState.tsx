import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  action?: ReactNode;
}

// What a list shows when it has nothing in it yet.
export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
