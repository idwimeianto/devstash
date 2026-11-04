import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { ChaosIcons } from "@/components/home/ChaosIcons";
import {
  Container,
  GradientText,
  HomeLead,
  homeButton,
  WindowBar,
} from "@/components/home/HomeShared";
import { Reveal } from "@/components/home/Reveal";
import { CtaLink } from "@/components/home/SessionLinks";
import { getHomeTypeIcon, HOME_ACCENTS, PREVIEW_CARDS, PREVIEW_TYPES } from "@/lib/home-content";
import { cn } from "@/lib/utils";

function Panel({ label, labelClassName, children }: { label: string; labelClassName?: string; children: ReactNode }) {
  return (
    <figure className="flex w-full min-w-0 flex-col gap-3">
      <figcaption className={cn("text-sm font-medium text-muted-foreground", labelClassName)}>
        {label}
      </figcaption>
      {children}
    </figure>
  );
}

function DashboardPreview() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-xl border border-white/15 bg-card shadow-2xl shadow-black/45 md:h-90"
    >
      <WindowBar />
      <div className="grid min-[441px]:grid-cols-[112px_1fr] md:h-[calc(100%-2.125rem)]">
        <div className="hidden border-r px-2.5 py-3 text-xs min-[441px]:block">
          <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
            Types
          </p>
          {PREVIEW_TYPES.map(({ type, label }, i) => (
            <p
              key={type}
              className={cn(
                "flex items-center gap-2 rounded-md px-1.5 py-1 text-muted-foreground",
                i === 0 && "bg-white/5 text-foreground",
              )}
            >
              <i className={cn("size-2 rounded-full", HOME_ACCENTS[type].dot)} />
              {label}
            </p>
          ))}
        </div>
        <div className="grid min-w-0 auto-rows-fr grid-cols-2 gap-2.5 p-3">
          {PREVIEW_CARDS.map(({ title, type }) => {
            const Icon = getHomeTypeIcon(type);
            return (
              <div
                key={title}
                className={cn(
                  "flex min-w-0 flex-col gap-1.5 rounded-lg border border-t-3 bg-zinc-900 p-2.5 text-xs",
                  HOME_ACCENTS[type].borderTop,
                )}
              >
                <Icon className={cn("size-3.5", HOME_ACCENTS[type].text)} />
                <b className="truncate font-semibold">{title}</b>
                <span className="h-1.25 rounded-sm bg-white/8" />
                <span className="h-1.25 w-3/5 rounded-sm bg-white/8" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-38 pb-20 sm:pb-28">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(600px_300px_at_20%_0%,rgb(59_130_246/0.16),transparent_70%),radial-gradient(500px_300px_at_85%_10%,rgb(236_72_153/0.1),transparent_70%)]"
      />
      <Container>
        <Reveal className="mx-auto max-w-195 text-center">
          <h1 className="text-[clamp(2.4rem,6vw,4.25rem)] leading-[1.05] font-bold tracking-tighter">
            Stop Losing Your <GradientText>Developer Knowledge</GradientText>
          </h1>
          <HomeLead className="mx-auto mt-6 max-w-155">
            Snippets in VS Code, prompts in chat histories, commands in your bash history, links in a
            hundred bookmarks. DevStash brings it all into one fast, searchable, AI-enhanced hub.
          </HomeLead>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <CtaLink label="Start for free" className="max-[440px]:w-full" />
            <a href="#features" className={homeButton("outline", "lg", "max-[440px]:w-full")}>
              See how it works
            </a>
          </div>
        </Reveal>

        <Reveal className="mt-18 grid items-center justify-items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          <Panel label="Your knowledge today...">
            <ChaosIcons />
          </Panel>
          <div
            aria-hidden="true"
            className="grid size-14 rotate-90 place-items-center rounded-full bg-linear-to-r from-blue-500 to-blue-400 text-white motion-safe:animate-arrow-pulse md:rotate-0"
          >
            <ArrowRight className="size-6.5" />
          </div>
          <Panel label="...with DevStash" labelClassName="md:text-right">
            <DashboardPreview />
          </Panel>
        </Reveal>
      </Container>
    </section>
  );
}
