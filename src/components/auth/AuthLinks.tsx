import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// 32px tall, so the small text links stay easy to tap.
const BASE_CLASSES = "inline-flex min-h-8 items-center underline-offset-4 hover:underline";

interface AuthLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

// Stands out from the muted sentence around it, e.g. "Don't have an account? Register".
export function AuthLink({ href, className, children }: AuthLinkProps) {
  return (
    <Link href={href} className={cn(BASE_CLASSES, "text-foreground", className)}>
      {children}
    </Link>
  );
}

// A quiet link on its own line, e.g. "Forgot password?".
export function AuthMutedLink({ href, className, children }: AuthLinkProps) {
  return (
    <Link
      href={href}
      className={cn(BASE_CLASSES, "text-sm text-muted-foreground hover:text-foreground", className)}
    >
      {children}
    </Link>
  );
}
