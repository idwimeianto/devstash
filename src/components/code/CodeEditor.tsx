"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { CopyButton } from "@/components/code/CopyButton";
import { getMonacoLanguage } from "@/lib/code-language";
import { cn } from "@/lib/utils";

// Monaco only runs in the browser and is large, so it loads on first use.
const MonacoEditor = dynamic(() => import("@/components/code/MonacoEditor"), {
  ssr: false,
  loading: () => null,
});

interface CodeEditorProps {
  value: string;
  // The item's own language text, shown in the header and mapped to Monaco's language id.
  language?: string | null;
  readOnly?: boolean;
  ariaLabel: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
  className?: string;
}

export function CodeEditor({
  value,
  language,
  readOnly = false,
  ariaLabel,
  onChange,
  invalid = false,
  className,
}: CodeEditorProps) {
  const [ready, setReady] = useState(false);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-background",
        invalid && "border-destructive",
        className,
      )}
    >
      <CodeEditorHeader value={value} language={language?.trim()} />
      <div className="relative">
        {/* Shown until Monaco mounts, with the same font metrics, so the code is readable at once. */}
        {!ready && <CodeFallback value={value} editable={!readOnly} />}
        <div className={cn(!ready && "pointer-events-none absolute inset-0 opacity-0")}>
          <MonacoEditor
            value={value}
            language={getMonacoLanguage(language)}
            readOnly={readOnly}
            ariaLabel={ariaLabel}
            onChange={onChange}
            onReady={() => setReady(true)}
          />
        </div>
      </div>
    </div>
  );
}

interface CodeEditorHeaderProps {
  value: string;
  language?: string;
}

// macOS-style window bar: traffic-light dots, the language and a copy button.
function CodeEditorHeader({ value, language }: CodeEditorHeaderProps) {
  return (
    <div className="flex h-9 items-center gap-3 border-b bg-muted/40 px-3">
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
      </div>
      <div className="ml-auto flex min-w-0 items-center gap-1">
        {language && (
          <span className="truncate font-mono text-xs text-muted-foreground">{language}</span>
        )}
        <CopyButton value={value} label="Copy code" />
      </div>
    </div>
  );
}

interface CodeFallbackProps {
  value: string;
  editable: boolean;
}

// Matches MonacoEditor's font size, 18px lines, 12px padding and line-number gutter.
function CodeFallback({ value, editable }: CodeFallbackProps) {
  return (
    <pre
      className={cn(
        "max-h-[400px] overflow-hidden py-3 pr-4 pl-[52px] font-mono text-xs leading-[18px] whitespace-pre",
        editable && "min-h-[120px]",
      )}
    >
      {value || " "}
    </pre>
  );
}
