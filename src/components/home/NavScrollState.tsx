"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const SCROLL_THRESHOLD = 16;

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const getScrolled = () => window.scrollY > SCROLL_THRESHOLD;
const getServerScrolled = () => false;

// The fixed nav, see-through at the top and more opaque once the page scrolls.
export function NavScrollState({ children }: { children: ReactNode }) {
  const scrolled = useSyncExternalStore(subscribe, getScrolled, getServerScrolled);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="fixed inset-x-0 top-0 z-50 h-16 border-b border-transparent bg-background/35 backdrop-blur-md transition-colors duration-300 data-scrolled:border-border data-scrolled:bg-background/90"
    >
      {children}
    </header>
  );
}
