import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { HomeMobileMenu } from "@/components/home/HomeMobileMenu";
import { homeButton } from "@/components/home/HomeShared";
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

function FreePlanCtaContent({ signedIn }: { signedIn: boolean }) {
  if (signedIn) {
    // Every account is on the free plan until billing exists.
    return (
      <span
        aria-disabled="true"
        className={homeButton("outline", "default", "pointer-events-none w-full opacity-60")}
      >
        Current plan
      </span>
    );
  }
  return (
    <Link href="/register" className={homeButton("outline", "default", "w-full")}>
      Get started
    </Link>
  );
}

async function SessionFreePlanCta() {
  return <FreePlanCtaContent signedIn={await isSignedIn()} />;
}

// The Free plan card's button: "Get started" when signed out, a "Current plan" label when signed in.
export function FreePlanCta() {
  return (
    <Suspense fallback={<FreePlanCtaContent signedIn={false} />}>
      <SessionFreePlanCta />
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
