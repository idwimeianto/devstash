import Link from "next/link";
import type { ReactNode } from "react";

import { BillingToggle, ProPrice } from "@/components/home/BillingToggle";
import { Checklist, Container, homeButton, SectionHeading } from "@/components/home/HomeShared";
import { Reveal } from "@/components/home/Reveal";
import { Card } from "@/components/ui/card";
import { FREE_PLAN_FEATURES, PRO_PLAN_FEATURES } from "@/lib/home-content";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  name: string;
  price: ReactNode;
  features: string[];
  cta: ReactNode;
  highlighted?: boolean;
}

function PlanCard({ name, price, features, cta, highlighted = false }: PlanCardProps) {
  return (
    <Card
      className={cn(
        "relative h-full gap-0 overflow-visible border bg-card p-6 ring-0 sm:p-8",
        highlighted
          ? "border-blue-500/60 bg-linear-to-b from-blue-500/8 to-card to-40% shadow-2xl shadow-blue-500/12"
          : "border-white/8",
      )}
    >
      {highlighted && (
        <span className="absolute -top-3.25 left-1/2 -translate-x-1/2 rounded-full bg-linear-to-r from-blue-500 to-blue-400 px-3.5 py-1 text-xs font-semibold whitespace-nowrap text-white">
          Most Popular
        </span>
      )}
      <h3 className="text-xl font-semibold">{name}</h3>
      {price}
      <Checklist items={features} className="mt-7 mb-8 flex-1 text-[15px]" />
      {cta}
    </Card>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-16 py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Pricing"
            title="Start free, upgrade when you need more"
            className="mb-0"
          />
        </Reveal>
        <BillingToggle>
          <div className="mt-14 grid justify-center gap-9 sm:grid-cols-[repeat(2,minmax(0,380px))] sm:gap-6">
            <Reveal>
              <PlanCard
                name="Free"
                price={
                  <>
                    <p className="mt-4 flex items-baseline gap-1">
                      <strong className="text-5xl leading-none font-bold tracking-tight">$0</strong>
                      <span className="text-muted-foreground">/forever</span>
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">For trying DevStash out.</p>
                  </>
                }
                features={FREE_PLAN_FEATURES}
                cta={
                  <Link href="/register" className={homeButton("outline", "default", "w-full")}>
                    Get started
                  </Link>
                }
              />
            </Reveal>
            <Reveal delay={1}>
              <PlanCard
                name="Pro"
                highlighted
                price={<ProPrice />}
                features={PRO_PLAN_FEATURES}
                cta={
                  <Link href="/register" className={homeButton("primary", "default", "w-full")}>
                    Upgrade to Pro
                  </Link>
                }
              />
            </Reveal>
          </div>
        </BillingToggle>
      </Container>
    </section>
  );
}

