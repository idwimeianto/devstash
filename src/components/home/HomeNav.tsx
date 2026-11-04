import { Container, Logo } from "@/components/home/HomeShared";
import { NavScrollState } from "@/components/home/NavScrollState";
import { NavActions } from "@/components/home/SessionLinks";
import { HOME_NAV_LINKS } from "@/lib/home-content";

export function HomeNav() {
  return (
    <NavScrollState>
      <Container className="flex h-full items-center gap-8">
        <Logo label="DevStash home" />
        <nav aria-label="Main" className="hidden gap-2 text-sm text-muted-foreground sm:flex">
          {HOME_NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="inline-flex min-h-9 items-center rounded-md px-2 transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex gap-2">
          <NavActions />
        </div>
      </Container>
    </NavScrollState>
  );
}
