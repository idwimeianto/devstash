import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { HomeMobileMenu } from "@/components/home/HomeMobileMenu";
import { homeButton } from "@/components/home/HomeShared";
import { getUserPlan } from "@/lib/db/billing";
import { getSessionUserId } from "@/lib/db/users";

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

// The session is request-time data, so the signed-out links render first and stream in their place.
export function NavActions() {
  return (
    <Suspense fallback={<NavActionLinks signedIn={false} />}>
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
    <Suspense fallback={<FreePlanCtaContent visitor="signedOut" />}>
      <SessionFreePlanCta />
    </Suspense>
  );
}

function ProPlanCtaContent({ visitor }: { visitor: Visitor }) {
  if (visitor === "pro") return <PlanLabel variant="primary">Current plan</PlanLabel>;
  return (
    <Link
      href={visitor === "free" ? "/settings#billing" : "/register"}
      className={homeButton("primary", "default", "w-full")}
    >
      Upgrade to Pro
    </Link>
  );
}

async function SessionProPlanCta() {
  return <ProPlanCtaContent visitor={await getVisitor()} />;
}

// The Pro plan card's button: `/register` when signed out, the settings Billing card for free
// users, and a "Current plan" label for Pro users.
export function ProPlanCta() {
  return (
    <Suspense fallback={<ProPlanCtaContent visitor="signedOut" />}>
      <SessionProPlanCta />
    </Suspense>
  );
}

// A main call to action: `/register` when signed out, `/dashboard` when signed in.
export function CtaLink(props: CtaLinkProps) {
  return (
    <Suspense fallback={<CtaLinkContent {...props} signedIn={false} />}>
      <SessionCtaLink {...props} />
    </Suspense>
  );
}
