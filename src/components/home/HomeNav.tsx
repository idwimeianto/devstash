import { Container, Logo } from "@/components/home/HomeShared";
import { NavScrollState } from "@/components/home/NavScrollState";
import { NavActions } from "@/components/home/SessionLinks";

export function HomeNav() {
  return (
    <NavScrollState>
      <Container className="flex h-full items-center gap-8">
        <Logo label="DevStash home" />
        <nav aria-label="Main" className="hidden gap-6 text-sm text-muted-foreground sm:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="transition-colors hover:text-foreground">
            Pricing
          </a>
        </nav>
        <div className="ml-auto flex gap-2">
          <NavActions />
        </div>
      </Container>
    </NavScrollState>
  );
}
