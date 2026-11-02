"use client";

import { CircleAlert, CircleCheck, MailCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VerifyEmailStatusKey = "sent" | "verified" | "expired" | "invalid";

interface StatusContent {
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  description: string;
}

const STATUS_CONTENT: Record<VerifyEmailStatusKey, StatusContent> = {
  sent: {
    icon: MailCheck,
    iconClassName: "bg-violet-500/10 text-violet-400",
    title: "Check your email",
    description:
      "We sent you a verification link. Click it to finish creating your account. The link expires in 24 hours.",
  },
  verified: {
    icon: CircleCheck,
    iconClassName: "bg-emerald-500/10 text-emerald-400",
    title: "Email verified",
    description: "Your email is confirmed. You can now sign in to DevStash.",
  },
  expired: {
    icon: CircleAlert,
    iconClassName: "bg-destructive/10 text-destructive",
    title: "Link expired",
    description: "This verification link has expired. Register again to get a new one.",
  },
  invalid: {
    icon: CircleAlert,
    iconClassName: "bg-destructive/10 text-destructive",
    title: "Invalid link",
    description: "This verification link is invalid or has already been used.",
  },
};

function isStatusKey(value: string | null): value is VerifyEmailStatusKey {
  return value !== null && value in STATUS_CONTENT;
}

export function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const status = isStatusKey(statusParam) ? statusParam : "invalid";
  const email = status === "sent" ? searchParams.get("email") : null;

  const { icon: Icon, iconClassName, title, description } = STATUS_CONTENT[status];

  return (
    <div className="grid justify-items-center gap-4 text-center">
      <div className={cn("flex size-12 items-center justify-center rounded-full", iconClassName)}>
        <Icon className="size-6" />
      </div>
      <div className="grid gap-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        {email && (
          <p className="text-sm text-muted-foreground">
            Sent to <span className="font-medium text-foreground">{email}</span>
          </p>
        )}
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Link
        href="/sign-in"
        className={cn(
          buttonVariants({ variant: status === "verified" ? "default" : "outline" }),
          "mt-2 w-full",
        )}
      >
        Back to sign in
      </Link>
    </div>
  );
}
