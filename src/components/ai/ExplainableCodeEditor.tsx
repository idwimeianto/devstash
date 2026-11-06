"use client";

import { Crown, Loader2, Sparkles } from "lucide-react";
import { Suspense, useId, useState, useTransition } from "react";

import { explainCode } from "@/actions/ai";
import { useCanUseAi } from "@/components/ai/AiAccessProvider";
import { CodeEditor } from "@/components/code/CodeEditor";
import { MarkdownPreview } from "@/components/markdown/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { runItemAction } from "@/lib/run-item-action";
import { cn } from "@/lib/utils";

type CodeTab = "code" | "explain";

const TAB_LABELS: Record<CodeTab, string> = { code: "Code", explain: "Explain" };
const PRO_TOOLTIP = "AI features require Pro subscription";

interface ExplainableCodeEditorProps {
  title: string;
  value: string;
  language: string | null;
  ariaLabel: string;
}

// A read-only code editor with an AI explanation. The explanation isn't saved, and clicking
// Explain again writes a new one.
export function ExplainableCodeEditor({
  title,
  value,
  language,
  ariaLabel,
}: ExplainableCodeEditorProps) {
  const id = useId();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [tab, setTab] = useState<CodeTab>("code");
  const [pending, startTransition] = useTransition();
  const showExplanation = explanation !== null && tab === "explain";

  function explain() {
    startTransition(async () => {
      const result = await runItemAction(() =>
        explainCode({ title, language: language ?? undefined, content: value }),
      );
      if (!result) return;
      setExplanation(result.explanation);
      setTab("explain");
    });
  }

  return (
    <CodeEditor
      value={value}
      language={language}
      readOnly
      ariaLabel={ariaLabel}
      copy={
        showExplanation
          ? { value: explanation, label: "Copy explanation" }
          : { value, label: "Copy code" }
      }
      headerTabs={
        explanation !== null && (
          <div role="tablist" aria-label={`${ariaLabel} view`} className="flex shrink-0 gap-1">
            <CodeTabButton id={id} tab="code" active={tab} onSelect={setTab} />
            <CodeTabButton id={id} tab="explain" active={tab} onSelect={setTab} />
          </div>
        )
      }
      headerActions={
        // Hidden until the plan is known, so free users never see the wrong icon first.
        <Suspense fallback={null}>
          <ExplainButton pending={pending} onClick={explain} />
        </Suspense>
      }
      renderBody={(editor) =>
        explanation === null ? (
          editor
        ) : (
          <div
            role="tabpanel"
            id={`${id}-${tab}-panel`}
            aria-labelledby={`${id}-${tab}-tab`}
            className={cn(showExplanation && "max-h-[400px] overflow-auto px-4 py-3")}
          >
            {showExplanation ? <MarkdownPreview value={explanation} /> : editor}
          </div>
        )
      }
    />
  );
}

interface CodeTabButtonProps {
  id: string;
  tab: CodeTab;
  active: CodeTab;
  onSelect: (tab: CodeTab) => void;
}

function CodeTabButton({ id, tab, active, onSelect }: CodeTabButtonProps) {
  const selected = tab === active;

  return (
    <button
      type="button"
      role="tab"
      id={`${id}-${tab}-tab`}
      aria-selected={selected}
      aria-controls={selected ? `${id}-${tab}-panel` : undefined}
      onClick={() => onSelect(tab)}
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        selected ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {TAB_LABELS[tab]}
    </button>
  );
}

interface ExplainButtonProps {
  pending: boolean;
  onClick: () => void;
}

function ExplainButton({ pending, onClick }: ExplainButtonProps) {
  const canUseAi = useCanUseAi();

  if (canUseAi) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        aria-label="Explain with AI"
        aria-busy={pending}
        disabled={pending}
        onClick={onClick}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
        Explain
      </Button>
    );
  }

  // Clicking still asks the server, which answers free users with the upgrade toast.
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label={`Explain with AI. ${PRO_TOOLTIP}`}
            aria-busy={pending}
            disabled={pending}
            onClick={onClick}
          />
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <Crown />}
        Explain
      </TooltipTrigger>
      <TooltipContent>{PRO_TOOLTIP}</TooltipContent>
    </Tooltip>
  );
}
