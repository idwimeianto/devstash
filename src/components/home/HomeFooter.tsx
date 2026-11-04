import { cacheLife } from "next/cache";
import Link from "next/link";

import { Container, Logo } from "@/components/home/HomeShared";
import { FOOTER_COLUMNS } from "@/lib/home-content";

// 32px tall rows, so the links are comfortable tap targets.
const FOOTER_LINK_CLASSES =
  "inline-flex min-h-8 items-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-blue-500";

// Cached, so the footer can still be prerendered; the year refreshes with the cache.
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export function HomeFooter() {
  return (
    <footer className="border-t pt-14 text-sm">
      <Container className="grid grid-cols-2 gap-8 sm:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="col-span-full sm:col-span-1">
          <Logo />
          <p className="mt-3 text-muted-foreground">One hub for all your developer knowledge.</p>
        </div>
        {FOOTER_COLUMNS.map(({ heading, links }) => (
          <nav key={heading} aria-label={heading} className="flex flex-col items-start">
            <h2 className="mb-2 text-[13px] font-semibold">{heading}</h2>
            {links.map(({ label, href }) =>
              href.startsWith("#") ? (
                <a key={label} href={href} className={FOOTER_LINK_CLASSES}>
                  {label}
                </a>
              ) : (
                <Link key={label} href={href} className={FOOTER_LINK_CLASSES}>
                  {label}
                </Link>
              ),
            )}
          </nav>
        ))}
      </Container>
      <Container className="mt-12 border-t pt-6 pb-8 text-zinc-400">
        <p>
          &copy; <CopyrightYear /> DevStash. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
