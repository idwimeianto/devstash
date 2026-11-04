"use client";

import { AppWindow, Bookmark, FileText, Terminal } from "lucide-react";
import { useEffect, useRef, type ComponentType, type SVGProps } from "react";

import { GitHubIcon } from "@/components/auth/GitHubIcon";
import { NotionIcon, SlackIcon, VSCodeIcon } from "@/components/home/BrandIcons";
import {
  createChaosBodies,
  getChaosTransform,
  getFrameDelta,
  stepChaosBody,
  type Bounds,
  type Point,
} from "@/lib/chaos-physics";
import { cn } from "@/lib/utils";

interface ChaosIcon {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  color: string;
  // Static spot (in icon widths) used without JavaScript or with reduced motion.
  position: string;
}

const CHAOS_ICONS: ChaosIcon[] = [
  { label: "Notion", icon: NotionIcon, color: "text-zinc-100", position: "translate-x-[8%] translate-y-[10%]" },
  { label: "GitHub", icon: GitHubIcon, color: "text-zinc-100", position: "translate-x-[250%] translate-y-[40%]" },
  { label: "Slack", icon: SlackIcon, color: "", position: "translate-x-[480%] translate-y-[15%]" },
  { label: "VS Code", icon: VSCodeIcon, color: "", position: "translate-x-[60%] translate-y-[230%]" },
  { label: "Browser tabs", icon: AppWindow, color: "", position: "translate-x-[330%] translate-y-[260%]" },
  { label: "Terminal", icon: Terminal, color: "", position: "translate-x-[30%] translate-y-[450%]" },
  { label: "Text file", icon: FileText, color: "", position: "translate-x-[250%] translate-y-[470%]" },
  { label: "Bookmarks", icon: Bookmark, color: "", position: "translate-x-[460%] translate-y-[430%]" },
];

// Floating icons that drift, bounce off the walls and glide away from the cursor.
// The physics lives in `@/lib/chaos-physics`; this only wires it to the DOM.
export function ChaosIcons() {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const icons = [...box.querySelectorAll<HTMLElement>("[data-chaos-icon]")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let bounds: Bounds = { width: box.clientWidth, height: box.clientHeight };
    let bodies = createChaosBodies(icons.length, bounds);
    let pointer: Point | null = null;
    let frame = 0;
    let running = false;
    let onScreen = false;
    let lastTime = 0;

    function tick(time: number) {
      const dt = getFrameDelta(time - lastTime);
      lastTime = time;
      bodies = bodies.map((body, i) => {
        const next = stepChaosBody(body, bounds, pointer, dt);
        icons[i].style.transform = getChaosTransform(next, time);
        return next;
      });
      frame = requestAnimationFrame(tick);
    }

    function start() {
      if (running || !onScreen || reducedMotion.matches) return;
      running = true;
      // Drops the static layout's `translate` so it doesn't add to the animated transform.
      box!.setAttribute("data-animated", "");
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(frame);
    }

    // Reduced motion goes back to the static layout.
    function applyMotionPreference() {
      if (!reducedMotion.matches) return start();
      stop();
      box!.removeAttribute("data-animated");
      icons.forEach((icon) => icon.style.removeProperty("transform"));
    }

    function onPointerMove(event: PointerEvent) {
      const rect = box!.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
    function onPointerLeave() {
      pointer = null;
    }

    box.addEventListener("pointermove", onPointerMove);
    box.addEventListener("pointerleave", onPointerLeave);
    reducedMotion.addEventListener("change", applyMotionPreference);

    const resizeObserver = new ResizeObserver(() => {
      bounds = { width: box.clientWidth, height: box.clientHeight };
    });
    resizeObserver.observe(box);

    // Only animate while the box is on screen.
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false;
      if (onScreen) start();
      else stop();
    });
    visibilityObserver.observe(box);

    return () => {
      stop();
      box.removeEventListener("pointermove", onPointerMove);
      box.removeEventListener("pointerleave", onPointerLeave);
      reducedMotion.removeEventListener("change", applyMotionPreference);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={boxRef}
      className="group/chaos relative h-80 touch-pan-y overflow-hidden rounded-xl border border-dashed border-white/15 bg-card md:h-90"
    >
      {CHAOS_ICONS.map(({ label, icon: Icon, color, position }) => (
        <span
          key={label}
          data-chaos-icon
          title={label}
          className={cn(
            "absolute top-0 left-0 grid size-14 place-items-center rounded-[14px] border border-white/15 bg-zinc-900 text-muted-foreground shadow-lg shadow-black/35 will-change-transform group-data-animated/chaos:translate-none",
            position,
            color,
          )}
        >
          <Icon className="size-6.5" />
          <span className="sr-only">{label}</span>
        </span>
      ))}
    </div>
  );
}
