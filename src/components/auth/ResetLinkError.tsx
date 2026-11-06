import { CircleAlert } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResetLinkStatus } from "@/types/auth";

const STATUS_CONTENT: Record<ResetLinkStatus, { title: string; description: string }> = {
  expired: {
    title: "Link expired",
    description: "This password reset link has expired. Request a new one to continue.",
  },
  invalid: {
    title: "Invalid link",
    description: "This password reset link is invalid or has already been used.",
  },
};

interface ResetLinkErrorProps {
  status: ResetLinkStatus;
}

export function ResetLinkError({ status }: ResetLinkErrorProps) {
  const { title, description } = STATUS_CONTENT[status];

  return (
    <div className="grid justify-items-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <CircleAlert className="size-6" />
      </div>
      <div className="grid gap-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Link href="/forgot-password" className={cn(buttonVariants(), "mt-2 w-full")}>
        Request a new link
      </Link>
      <Link
        href="/sign-in"
        className="inline-flex min-h-8 items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Back to sign in
      </Link>
    </div>
  );
}
