"use client";

import { Check, Copy } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getMonacoLanguage } from "@/lib/code-language";
import { cn } from "@/lib/utils";

// Monaco only runs in the browser and is large, so it loads on first use.
const MonacoEditor = dynamic(() => import("@/components/code/MonacoEditor"), {
  ssr: false,
  loading: () => null,
});

const COPIED_RESET_MS = 2000;

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
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      toast.error("Couldn't copy to the clipboard");
      return;
    }
    toast.success("Copied to clipboard");
    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }

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
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          disabled={!value}
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? <Check className="text-emerald-500" /> : <Copy />}
        </Button>
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
