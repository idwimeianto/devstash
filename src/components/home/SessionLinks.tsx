import { ArrowRight, LoaderCircle, Menu } from "lucide-react";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";

import { HomeMobileMenu } from "@/components/home/HomeMobileMenu";
import { homeButton } from "@/components/home/HomeShared";
import { getUserPlan } from "@/lib/db/billing";
import { getSessionUserId } from "@/lib/db/users";
import { UPGRADE_HREF } from "@/lib/usage-limits";
import { cn } from "@/lib/utils";

type HomeButtonArgs = Parameters<typeof homeButton>;

interface LoadingButtonProps {
  label: string;
  variant: HomeButtonArgs[0];
  size?: HomeButtonArgs[1];
  className?: string;
  arrow?: boolean;
}

// Shown while the session streams in: the signed-out button's shape and width (its label kept
// invisible) with a spinner on top, so the real button replaces it without a layout shift.
function LoadingButton({ label, variant, size = "default", className, arrow }: LoadingButtonProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={homeButton(variant, size, cn("pointer-events-none relative opacity-70", className))}
    >
      <span aria-hidden="true" className="invisible inline-flex items-center gap-2">
        {label}
        {arrow && <ArrowRight />}
      </span>
      <LoaderCircle aria-hidden="true" className="absolute animate-spin" />
    </span>
  );
}

// Streamed content is swapped in by a script, so without JavaScript the signed-out version stays.
function SessionFallback({ loading, noScript }: { loading: ReactNode; noScript: ReactNode }) {
  return (
    <>
      <span className="hidden scripting:contents">{loading}</span>
      <span className="contents scripting:hidden">{noScript}</span>
    </>
  );
}

async function isSignedIn(): Promise<boolean> {
  return (await getSessionUserId()) !== null;
}

function NavActionLinks({ signedIn }: { signedIn: boolean }) {
  if (signedIn) {
    return (
      <>
        <Link href="/dashboard" className={homeButton("primary")}>
          Dashboard
        </Link>
        <HomeMobileMenu signedIn />
      </>
    );
  }
  return (
    <>
      <Link href="/sign-in" className={homeButton("ghost", "default", "max-[440px]:hidden")}>
        Sign In
      </Link>
      <Link href="/register" className={homeButton("primary")}>
        Get Started
      </Link>
      <HomeMobileMenu signedIn={false} />
    </>
  );
}

async function SessionNavActions() {
  return <NavActionLinks signedIn={await isSignedIn()} />;
}

function NavActionsLoading() {
  return (
    <>
      <LoadingButton label="Dashboard" variant="primary" />
      <span
        aria-hidden="true"
        className={homeButton("ghost", "default", "pointer-events-none size-9 px-0 opacity-50 sm:hidden")}
      >
        <Menu />
      </span>
    </>
  );
}

// The session is request-time data, so loading buttons render first and the real ones stream in.
export function NavActions() {
  return (
    <Suspense
      fallback={<SessionFallback loading={<NavActionsLoading />} noScript={<NavActionLinks signedIn={false} />} />}
    >
      <SessionNavActions />
    </Suspense>
  );
}

interface CtaLinkProps {
  label: string;
  className?: string;
}

function CtaLinkContent({ label, className, signedIn }: CtaLinkProps & { signedIn: boolean }) {
  return (
    <Link href={signedIn ? "/dashboard" : "/register"} className={homeButton("primary", "lg", className)}>
      {signedIn ? "Go to your dashboard" : label}
      <ArrowRight />
    </Link>
  );
}

async function SessionCtaLink(props: CtaLinkProps) {
  return <CtaLinkContent {...props} signedIn={await isSignedIn()} />;
}

type Visitor = "signedOut" | "free" | "pro";

// Read from the database, like enforcement, so the buttons match right after a webhook.
async function getVisitor(): Promise<Visitor> {
  const userId = await getSessionUserId();
  if (!userId) return "signedOut";
  return (await getUserPlan(userId)).isPro ? "pro" : "free";
}

function PlanLabel({ children, variant }: { children: string; variant: "outline" | "primary" }) {
  return (
    <span
      aria-disabled="true"
      className={homeButton(variant, "default", "pointer-events-none w-full opacity-60")}
    >
      {children}
    </span>
  );
}

function FreePlanCtaContent({ visitor }: { visitor: Visitor }) {
  if (visitor === "free") return <PlanLabel variant="outline">Current plan</PlanLabel>;
  if (visitor === "pro") return <PlanLabel variant="outline">Included</PlanLabel>;
  return (
    <Link href="/register" className={homeButton("outline", "default", "w-full")}>
      Get started
    </Link>
  );
}

async function SessionFreePlanCta() {
  return <FreePlanCtaContent visitor={await getVisitor()} />;
}

// The Free plan card's button: "Get started" when signed out, a label when signed in.
export function FreePlanCta() {
  return (
    <Suspense
      fallback={
        <SessionFallback
          loading={<LoadingButton label="Get started" variant="outline" className="w-full" />}
          noScript={<FreePlanCtaContent visitor="signedOut" />}
        />
      }
    >
      <SessionFreePlanCta />
    </Suspense>
  );
}

function ProPlanCtaContent({ visitor }: { visitor: Visitor }) {
  if (visitor === "pro") return <PlanLabel variant="primary">Current plan</PlanLabel>;
  return (
    <Link
      href={visitor === "free" ? UPGRADE_HREF : "/register"}
      className={homeButton("primary", "default", "w-full")}
    >
      Upgrade to Pro
    </Link>
  );
}

async function SessionProPlanCta() {
  return <ProPlanCtaContent visitor={await getVisitor()} />;
}

// The Pro plan card's button: `/register` when signed out, the upgrade page for free users,
// and a "Current plan" label for Pro users.
export function ProPlanCta() {
  return (
    <Suspense
      fallback={
        <SessionFallback
          loading={<LoadingButton label="Upgrade to Pro" variant="primary" className="w-full" />}
          noScript={<ProPlanCtaContent visitor="signedOut" />}
        />
      }
    >
      <SessionProPlanCta />
    </Suspense>
  );
}

// A main call to action: `/register` when signed out, `/dashboard` when signed in.
export function CtaLink(props: CtaLinkProps) {
  return (
    <Suspense
      fallback={
        <SessionFallback
          loading={
            <LoadingButton label={props.label} variant="primary" size="lg" className={props.className} arrow />
          }
          noScript={<CtaLinkContent {...props} signedIn={false} />}
        />
      }
    >
      <SessionCtaLink {...props} />
    </Suspense>
  );
}
