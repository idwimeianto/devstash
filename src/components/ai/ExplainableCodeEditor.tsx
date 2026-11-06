"use client";

import { useId, useState, useTransition } from "react";

import { explainCode } from "@/actions/ai";
import { AiActionButton, AiTabButton } from "@/components/ai/AiHeaderControls";
import { CodeEditor } from "@/components/code/CodeEditor";
import { MarkdownPreview } from "@/components/markdown/MarkdownEditor";
import { runItemAction } from "@/lib/run-item-action";
import { cn } from "@/lib/utils";

type CodeTab = "code" | "explain";

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
            <AiTabButton
              id={id}
              tab="code"
              label="Code"
              selected={tab === "code"}
              onSelect={() => setTab("code")}
            />
            <AiTabButton
              id={id}
              tab="explain"
              label="Explain"
              selected={tab === "explain"}
              onSelect={() => setTab("explain")}
            />
          </div>
        )
      }
      headerActions={
        <AiActionButton
          label="Explain"
          ariaLabel="Explain with AI"
          pending={pending}
          onClick={explain}
        />
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
