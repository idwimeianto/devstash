import { Check, Lock } from "lucide-react";
import Link from "next/link";

import { ProBadge } from "@/components/dashboard/ProBadge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getItemTypeDisplay, getItemTypeLabel } from "@/lib/item-type-display";
import { UPGRADE_HREF } from "@/lib/usage-limits";
import { cn } from "@/lib/utils";

const PRO_UPLOAD_BENEFITS = [
  "Upload files up to 10 MB and images up to 5 MB",
  "Preview images and download files from any item",
  "Unlimited items and collections",
];

interface ProTypeUpsellProps {
  typeName: string;
}

// Shown instead of a Pro-only type's page (files, images) to free users.
export function ProTypeUpsell({ typeName }: ProTypeUpsellProps) {
  const { icon: Icon, textColor, bgTint } = getItemTypeDisplay(typeName);
  const label = getItemTypeLabel(typeName);

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader className="items-center text-center">
        <div
          className={cn(
            "relative mx-auto mb-2 flex size-14 items-center justify-center rounded-2xl",
            bgTint,
          )}
        >
          <Icon className={cn("size-7", textColor)} />
          <span className="absolute -right-1.5 -bottom-1.5 flex size-6 items-center justify-center rounded-full border bg-background">
            <Lock className="size-3.5 text-muted-foreground" />
          </span>
        </div>
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          {label} are a Pro feature
          <ProBadge />
        </CardTitle>
        <CardDescription>
          Upgrade to Pro to store and organize your {label.toLowerCase()} alongside your
          snippets, prompts and notes.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <ul className="mx-auto grid gap-2 text-sm">
          {PRO_UPLOAD_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              {benefit}
            </li>
          ))}
        </ul>
        <div className="flex flex-col-reverse justify-center gap-2 sm:flex-row">
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            Back to dashboard
          </Link>
          <Link href={UPGRADE_HREF} className={buttonVariants()}>
            Upgrade to Pro
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
