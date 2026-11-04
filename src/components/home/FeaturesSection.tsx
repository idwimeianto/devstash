import { Container, SectionHeading } from "@/components/home/HomeShared";
import { Reveal } from "@/components/home/Reveal";
import { Card } from "@/components/ui/card";
import { FEATURES, HOME_ACCENTS } from "@/lib/home-content";
import { cn } from "@/lib/utils";

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-16 border-y bg-white/[0.025] py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Features"
            title="Everything you reach for, in one place"
            lead="Save it once, find it in seconds. Every type of developer knowledge gets a home."
          />
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, description, icon: Icon, accent }, i) => (
            // Reveal moves the wrapper, so the card's own hover lift still applies.
            <Reveal key={title} delay={(i % 3) as 0 | 1 | 2}>
              <Card
                className={cn(
                  "h-full gap-0 border border-white/8 bg-zinc-900 p-6 ring-0 transition-[border-color,box-shadow,translate] duration-250 hover:shadow-xl motion-safe:hover:-translate-y-1 sm:p-7",
                  HOME_ACCENTS[accent].hover,
                )}
              >
                <span
                  className={cn(
                    "mb-5 grid size-11 place-items-center rounded-[10px]",
                    HOME_ACCENTS[accent].tint,
                    HOME_ACCENTS[accent].text,
                  )}
                >
                  <Icon className="size-5.5" />
                </span>
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="text-[15px] text-muted-foreground">{description}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
