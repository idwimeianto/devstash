"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";

import { CopyButton } from "@/components/code/CopyButton";
import { useEditorPreferences } from "@/components/code/EditorPreferencesProvider";
import { getMonacoLanguage } from "@/lib/code-language";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";
import { cn } from "@/lib/utils";
import type { EditorPreferences } from "@/types/editor-preferences";

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
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-background",
        invalid && "border-destructive",
        className,
      )}
    >
      <CodeEditorHeader value={value} language={language?.trim()} />
      {/* The preferences have almost always arrived by the time an editor opens. */}
      <Suspense
        fallback={
          <CodeFallback
            value={value}
            editable={!readOnly}
            preferences={DEFAULT_EDITOR_PREFERENCES}
          />
        }
      >
        <CodeEditorBody
          value={value}
          language={language}
          readOnly={readOnly}
          ariaLabel={ariaLabel}
          onChange={onChange}
        />
      </Suspense>
    </div>
  );
}

type CodeEditorBodyProps = Pick<
  CodeEditorProps,
  "value" | "language" | "ariaLabel" | "onChange"
> & { readOnly: boolean };

function CodeEditorBody({ value, language, readOnly, ariaLabel, onChange }: CodeEditorBodyProps) {
  const [ready, setReady] = useState(false);
  const { preferences } = useEditorPreferences();

  return (
    <div className="relative">
      {/* Shown until Monaco mounts, with the same font metrics, so the code is readable at once. */}
      {!ready && <CodeFallback value={value} editable={!readOnly} preferences={preferences} />}
      <div className={cn(!ready && "pointer-events-none absolute inset-0 opacity-0")}>
        <MonacoEditor
          value={value}
          language={getMonacoLanguage(language)}
          readOnly={readOnly}
          ariaLabel={ariaLabel}
          preferences={preferences}
          onChange={onChange}
          onReady={() => setReady(true)}
        />
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

// Each font size with its line height (1.5×, rounded, as in getEditorLineHeight).
const FALLBACK_FONT_CLASSES: Record<EditorPreferences["fontSize"], string> = {
  10: "text-[10px] leading-[15px]",
  11: "text-[11px] leading-[17px]",
  12: "text-xs leading-[18px]",
  13: "text-[13px] leading-[20px]",
  14: "text-sm leading-[21px]",
  16: "text-base leading-[24px]",
  18: "text-lg leading-[27px]",
  20: "text-xl leading-[30px]",
};

interface CodeFallbackProps {
  value: string;
  editable: boolean;
  preferences: EditorPreferences;
}

// Matches MonacoEditor's font size, line height, wrapping, 12px padding and line-number gutter.
function CodeFallback({ value, editable, preferences }: CodeFallbackProps) {
  return (
    <pre
      className={cn(
        "max-h-[400px] overflow-hidden py-3 pr-4 pl-[52px] font-mono",
        FALLBACK_FONT_CLASSES[preferences.fontSize],
        preferences.wordWrap ? "wrap-break-word whitespace-pre-wrap" : "whitespace-pre",
        editable && "min-h-[120px]",
      )}
    >
      {value || " "}
    </pre>
  );
}
