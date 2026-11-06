"use client";

import { useEffect, useEffectEvent } from "react";

import { useSidebar } from "@/components/ui/sidebar";

const TABLET_QUERY = "(max-width: 1023px)";

// Collapses the sidebar to icons on tablets, where expanded it leaves too little room for the page.
// Only reacts on load and when crossing the width, so the toggle still works in between.
export function SidebarAutoCollapse() {
  const { setOpen } = useSidebar();
  // An effect event: setOpen changes on every toggle, which mustn't re-run the effect and re-collapse.
  const syncToWidth = useEffectEvent((isTablet: boolean) => setOpen(!isTablet));

  useEffect(() => {
    const query = window.matchMedia(TABLET_QUERY);
    const handleChange = (event: MediaQueryListEvent) => syncToWidth(event.matches);

    if (query.matches) syncToWidth(true);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return null;
}
