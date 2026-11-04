"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const DELAY_CLASSES = ["", "delay-100", "delay-200"] as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  // Staggers cards in a row: 0, 100 or 200ms.
  delay?: 0 | 1 | 2;
}

// Fades its content in once it scrolls into view. Children can react to it with `group-data-visible/reveal:`.
// Content is only hidden while JavaScript runs and motion is allowed, so it always shows otherwise.
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // Set on the DOM node rather than in state: it only drives CSS and never changes back.
    const show = () => element.setAttribute("data-visible", "");
    if (!("IntersectionObserver" in window)) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        show();
        observer.disconnect();
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "group/reveal motion-safe:transition-[opacity,translate] motion-safe:duration-700 motion-safe:ease-out scripting:motion-safe:not-data-visible:translate-y-6 scripting:motion-safe:not-data-visible:opacity-0",
        DELAY_CLASSES[delay],
        className,
      )}
    >
      {children}
    </div>
  );
}
