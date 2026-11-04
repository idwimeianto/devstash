import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Checklist, Container, HomeH2, HomeLead, WindowBar } from "@/components/home/HomeShared";
import { Reveal } from "@/components/home/Reveal";
import { Badge } from "@/components/ui/badge";
import { AI_CAPABILITIES, AI_TAGS } from "@/lib/home-content";
import { cn } from "@/lib/utils";

// One delay per tag, so they pop in one by one once the editor is revealed.
const TAG_DELAYS = ["delay-500", "delay-[650ms]", "delay-[800ms]", "delay-[950ms]", "delay-[1100ms]"];

const Keyword = ({ children }: { children: ReactNode }) => <span className="text-purple-400">{children}</span>;
const Fn = ({ children }: { children: ReactNode }) => <span className="text-blue-400">{children}</span>;
const Type = ({ children }: { children: ReactNode }) => <span className="text-teal-400">{children}</span>;
const Num = ({ children }: { children: ReactNode }) => <span className="text-amber-400">{children}</span>;

// Wraps on phones, where a sideways scroll has no visible cue and the lines look cut off.
function EditorCode() {
  return (
    <pre className="overflow-x-auto p-4 font-mono text-xs leading-[1.7] break-words whitespace-pre-wrap text-zinc-300 sm:p-5 sm:text-[13px] sm:whitespace-pre">
      <code>
        <Keyword>export function</Keyword> <Fn>useDebounce</Fn>&lt;<Type>T</Type>&gt;(value: <Type>T</Type>,
        delay = <Num>300</Num>) {"{"}
        {"\n  "}
        <Keyword>const</Keyword> [debounced, setDebounced] = <Fn>useState</Fn>(value);
        {"\n\n  "}
        <Fn>useEffect</Fn>(() =&gt; {"{"}
        {"\n    "}
        <Keyword>const</Keyword> id = <Fn>setTimeout</Fn>(() =&gt; <Fn>setDebounced</Fn>(value), delay);
        {"\n    "}
        <Keyword>return</Keyword> () =&gt; <Fn>clearTimeout</Fn>(id);
        {"\n  }, [value, delay]);\n\n  "}
        <Keyword>return</Keyword> debounced;
        {"\n}"}
      </code>
    </pre>
  );
}

export function AiSection() {
  return (
    <section id="ai" className="scroll-mt-16 border-b bg-white/[0.015] py-20 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal>
          <Badge
            variant="outline"
            className="mb-5 h-auto gap-1.5 border-amber-500/35 bg-amber-500/10 px-3 py-1 text-[13px] font-semibold text-amber-500"
          >
            <Sparkles /> Pro Feature
          </Badge>
          <HomeH2>Let AI do the busywork</HomeH2>
          <HomeLead>DevStash reads what you save and helps you keep it organized and understandable.</HomeLead>
          <Checklist items={AI_CAPABILITIES} className="mt-7" />
        </Reveal>

        <Reveal className="min-w-0">
          <figure
            aria-label="Example: AI tags generated for a TypeScript snippet"
            className="overflow-hidden rounded-xl border border-white/15 bg-card shadow-2xl shadow-black/45"
          >
            <WindowBar>
              <span className="ml-2.5 font-mono text-xs text-zinc-300">useDebounce.ts</span>
            </WindowBar>
            <EditorCode />
            <div className="border-t bg-zinc-900 px-5 pt-4 pb-5">
              <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-amber-500">
                <Sparkles className="size-3.5" /> AI Generated Tags
              </p>
              <ul className="flex flex-wrap gap-2">
                {AI_TAGS.map((tag, i) => (
                  <li
                    key={tag}
                    className={cn(
                      "rounded-full border border-blue-500/35 bg-blue-500/12 px-2.5 py-0.5 font-mono text-xs text-blue-200 motion-safe:transition-[opacity,translate,scale] motion-safe:duration-350 scripting:motion-safe:group-not-data-visible/reveal:translate-y-1.5 scripting:motion-safe:group-not-data-visible/reveal:scale-90 scripting:motion-safe:group-not-data-visible/reveal:opacity-0",
                      TAG_DELAYS[i],
                    )}
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </figure>
        </Reveal>
      </Container>
    </section>
  );
}
