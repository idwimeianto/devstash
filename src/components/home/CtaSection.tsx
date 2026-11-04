import { Container, HomeH2, HomeLead } from "@/components/home/HomeShared";
import { Reveal } from "@/components/home/Reveal";
import { CtaLink } from "@/components/home/SessionLinks";

export function CtaSection() {
  return (
    <section className="pb-20 sm:pb-28">
      <Container>
        <Reveal className="rounded-[20px] border bg-card bg-[radial-gradient(500px_220px_at_50%_0%,rgb(59_130_246/0.22),transparent_70%)] px-6 py-18 text-center">
          <HomeH2>Ready to Organize Your Knowledge?</HomeH2>
          <HomeLead className="mb-8">
            Stop digging through tabs and histories. Your next snippet is one search away.
          </HomeLead>
          <CtaLink label="Get started for free" />
        </Reveal>
      </Container>
    </section>
  );
}
